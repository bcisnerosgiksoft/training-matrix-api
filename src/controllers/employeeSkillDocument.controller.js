// src/controllers/employeeSkillDocument.controller.js
const path = require('path');
const fs = require('fs');

const EmployeeSkillDocument = require('../models/mongo/employeeSkillDocument.model');
const EmployeeSkill = require('../models/mysql/employeeSkill.model');
const Skill = require('../models/mysql/skill.model');
const User = require('../models/mysql/user.model');
const { createLog } = require('../utils/log.helper');

// Subir documentos para una habilidad asignada (queda igual, solo añado user_agent en log si lo usas aquí)
const uploadDocuments = async (req, res) => {
    try {
        const { employee_skill_id } = req.params;

        const skillEntry = await EmployeeSkill.findOne({ where: { id: employee_skill_id } });
        if (!skillEntry) return res.status(404).json({ message: 'Relación empleado-habilidad no encontrada' });

        const levelSeleccionado = parseInt(req.body.level ?? skillEntry.level, 10);
        if (levelSeleccionado !== skillEntry.level) {
            await EmployeeSkill.update(
                { level: levelSeleccionado, updated_by: req.user.id, updated_at: new Date() },
                { where: { id: employee_skill_id } }
            );
        }

        const rawFiles = req.files || [];
        const documents = rawFiles.filter(file => file.fieldname.startsWith('documents'));
        if (!documents.length) return res.status(400).json({ message: 'No se subieron archivos válidos' });

        const docs = [];
        for (const file of documents) {
            const newDoc = await EmployeeSkillDocument.create({
                employee_skill_id: Number(employee_skill_id),
                employee_id: skillEntry.employee_id,
                skill_id: skillEntry.skill_id,
                level: levelSeleccionado,
                uploaded_by: req.user.id,
                original_filename: file.originalname,
                filename: file.filename,
                path: `/uploads/employees/${skillEntry.employee_id}/skills/${employee_skill_id}/${file.filename}`
            });
            docs.push(newDoc);
        }

        // (Opcional) log estándar
        try {
            await createLog({
                user_id: req.user.id,
                user_name: req.user.username,
                action: 'upload_skill_documents',
                module: 'employee_skill_documents',
                description: `Se subieron ${docs.length} documentos a employee_skill_id=${employee_skill_id}`,
                ip: req.ip,
                user_agent: req.headers['user-agent'] || ''
            });
        } catch (_) {}

        return res.json({ message: 'Documentos subidos correctamente', files: docs });
    } catch (error) {
        console.error('❌ Error al subir documentos de habilidad:', error);
        return res.status(500).json({ message: 'Error al subir documentos' });
    }
};

// Listar documentos por employee_skill_id, con include_deleted y nombres de uploaded_by / deleted_by
const getSkillDocuments = async (req, res) => {
    try {
        const { employee_skill_id } = req.params;

        const includeDeletedFlag = (() => {
            const v = (req.query.include_deleted || req.query.audit || '').toString().toLowerCase();
            return ['1', 'true', 'yes'].includes(v);
        })();

        const filter = { employee_skill_id: parseInt(employee_skill_id, 10) };
        if (!includeDeletedFlag) {
            filter.$and = [
                { $or: [{ is_deleted: { $exists: false } }, { is_deleted: false }] },
                { $or: [{ deleted_at: { $exists: false } }, { deleted_at: null }] }
            ];
        }

        const docs = await EmployeeSkillDocument
            .find(filter, {
                _id: 1, employee_skill_id: 1, employee_id: 1, skill_id: 1, level: 1,
                filename: 1, original_filename: 1, path: 1,
                uploaded_by: 1, uploaded_at: 1,
                deleted_by: 1, deleted_at: 1, is_deleted: 1
            })
            .lean()
            .sort({ uploaded_at: -1 });

        if (!docs.length) return res.json([]);

        // Usuarios involucrados (subió / eliminó) y skills
        const userIds = [
            ...new Set(docs.flatMap(d => [d.uploaded_by, d.deleted_by]).filter(Boolean))
        ];
        const skillIds = [...new Set(docs.map(d => d.skill_id).filter(Boolean))];

        const [users, skills] = await Promise.all([
            userIds.length
                ? User.findAll({
                    where: { id: userIds },
                    attributes: ['id', 'first_name', 'last_name', 'username'],
                    paranoid: false
                })
                : Promise.resolve([]),
            skillIds.length
                ? Skill.findAll({ where: { id: skillIds }, attributes: ['id', 'name'] })
                : Promise.resolve([])
        ]);

        const formatUserShort = (u) => {
            const first = (u.first_name || '').trim().split(/\s+/)[0] || '';
            const last  = (u.last_name  || '').trim().split(/\s+/)[0] || '';
            const short = `${first} ${last}`.trim();
            return short || u.username || u.email || `Usuario #${u.id}`;
        };

        const userMap  = Object.fromEntries(users.map(u => [u.id, formatUserShort(u)]));
        const skillMap = Object.fromEntries(skills.map(s => [s.id, s.name]));

        const enriched = docs.map(d => ({
            ...d,
            skill_name: skillMap[d.skill_id] || 'Desconocido',
            uploaded_by_name: d.uploaded_by ? (userMap[d.uploaded_by] || 'Desconocido') : null,
            deleted_by_name:  d.deleted_by  ? (userMap[d.deleted_by]  || 'Desconocido') : null
        }));

        return res.json(enriched);
    } catch (error) {
        console.error('❌ Error al obtener documentos:', error);
        return res.status(500).json({ message: 'Error al obtener documentos' });
    }
};

// Soft delete de documento de habilidad (usa la ruta /employees/:id/skill-documents/:doc_id)
const softDeleteEmployeeSkillDocument = async (req, res) => {
    try {
        const employeeId = req.params.employee_id ?? req.params.id;
        const { doc_id } = req.params;

        const doc = await EmployeeSkillDocument.findById(doc_id);
        if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });

        if (String(doc.employee_id) !== String(employeeId)) {
            console.warn('Mismatch employeeId vs doc.employee_id', { docEmployeeId: doc.employee_id, employeeId });
            return res.status(403).json({ message: 'No autorizado para esta operación' });
        }

        if (doc.is_deleted) {
            return res.json({ message: 'El documento ya estaba dado de baja' });
        }

        doc.is_deleted = true;
        doc.deleted_at = new Date();
        doc.deleted_by = req.user.id;
        await doc.save();

        try {
            await createLog({
                user_id: req.user.id,
                user_name: req.user.username,
                action: 'void_skill_document',
                module: 'employee_skill_documents',
                description: `Documento de habilidad (MongoID: ${doc_id}) dado de baja`,
                ip: req.ip,
                user_agent: req.headers['user-agent'] || ''
            });
        } catch (_) {}

        return res.json({ message: 'Documento (habilidad) dado de baja' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al dar de baja documento de habilidad' });
    }
};

// Hard delete de documento de habilidad (borra archivo físico + registro)
const hardDeleteEmployeeSkillDocument = async (req, res) => {
    try {
        const employeeId = req.params.employee_id ?? req.params.id; // soporta ambos
        const { doc_id } = req.params;

        const doc = await EmployeeSkillDocument.findById(doc_id);
        if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });

        // Compara de forma robusta
        if (String(doc.employee_id) !== String(employeeId)) {
            // (opcional) log para depurar
            console.warn('Mismatch employeeId vs doc.employee_id', { docEmployeeId: doc.employee_id, employeeId });
            return res.status(403).json({ message: 'No autorizado para esta operación' });
        }

        // Borrado físico seguro
        const rootDir = path.join(__dirname, '../../');
        const relPath = (doc.path || '').replace(/^\//, '');
        const filePath = path.join(rootDir, relPath);
        try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (e) {
            console.warn('No se pudo borrar el archivo físico:', filePath, e.message);
        }

        await EmployeeSkillDocument.deleteOne({ _id: doc_id });

        try {
            await createLog({
                user_id: req.user.id,
                user_name: req.user.username,
                action: 'hard_delete_skill_document',
                module: 'employee_skill_documents',
                description: `Documento de habilidad (MongoID: ${doc_id}) eliminado permanentemente`,
                ip: req.ip,
                user_agent: req.headers['user-agent'] || ''
            });
        } catch (_) {}

        return res.json({ message: 'Documento (habilidad) eliminado permanentemente' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al eliminar documento de habilidad' });
    }
};


module.exports = {
    uploadDocuments,
    getSkillDocuments,
    softDeleteEmployeeSkillDocument,
    hardDeleteEmployeeSkillDocument
};
