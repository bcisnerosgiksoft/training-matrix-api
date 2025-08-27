const Employee = require('../models/mysql/employee.model');
const EmployeeDocument = require('../models/mongo/employeeDocument.model');
const { notifyUser } = require('../utils/notify.helper');
const { createLog } = require('../utils/log.helper');
const Shift = require('../models/mysql/shift.model');
const Position = require('../models/mysql/position.model');
const Area = require('../models/mysql/area.model');
const Class = require('../models/mysql/class.model');
const User = require('../models/mysql/user.model');

const EmployeeSkill = require('../models/mysql/employeeSkill.model');
const Skill = require('../models/mysql/skill.model');
const Operation = require('../models/mysql/operation.model');

// src/controllers/employee.controller.js
const EmployeeSkillDocument = require('../models/mongo/employeeSkillDocument.model');
const path = require('path');
const fs = require('fs');
const { Op, Sequelize } = require('sequelize');
const getAll = async (req, res) => {
    try {
        const employees = await Employee.findAll({
            paranoid: false,  // 👈 Esto es lo que te faltaba
            include: [
                { model: Shift, attributes: ['name'], paranoid: false },
                { model: Position, attributes: ['name'], paranoid: false },
                { model: Area, attributes: ['name'], paranoid: false },
                { model: Class, attributes: ['name'], paranoid: false }
            ]
        });

        const result = employees.map(emp => ({
            id: emp.id,
            employee_code: emp.employee_code,
            full_name: emp.full_name,
            hire_date: emp.hire_date,
            photo_url: emp.photo_url,
            shift_id: emp.shift_id,
            shift_name: emp.Shift?.name || null,
            position_id: emp.position_id,
            position_name: emp.Position?.name || null,
            area_id: emp.area_id,
            area_name: emp.Area?.name || null,
            class_id: emp.class_id,
            class_name: emp.Class?.name || null,
            createdAt: emp.createdAt,
            updatedAt: emp.updatedAt,
            deletedAt: emp.deletedAt
        }));

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener empleados' });
    }
};

const getOne = async (req, res) => {
    try {
        const { id } = req.params;

        // activa documentos si include=documents|true|1|yes o full=1
        const includeDocsFlag = (() => {
            const q = (req.query.include || '').toString().toLowerCase();
            return ['documents', 'true', '1', 'yes'].includes(q) || req.query.full === '1';
        })();

        // permite incluir eliminados (soft delete / void) si include_deleted=1|true|yes o audit=1
        const includeDeletedFlag = (() => {
            const v = (req.query.include_deleted || req.query.audit || '').toString().toLowerCase();
            return ['1', 'true', 'yes'].includes(v);
        })();

        // 1) Empleado y asociaciones SQL
        const employee = await Employee.findOne({
            where: { id },
            include: [
                { model: Shift, attributes: ['id', 'name', 'start_time', 'end_time'] },
                { model: Position, attributes: ['id', 'name', 'description'] },
                { model: Area, attributes: ['id', 'name'] },
                { model: Class, attributes: ['id', 'name'] }
            ]
        });

        if (!employee) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        // 2) Normaliza claves asociadas a minúsculas
        const plain = employee.get({ plain: true });
        for (const key of ['Shift', 'Position', 'Area', 'Class']) {
            if (plain[key]) {
                plain[key.toLowerCase()] = plain[key];
                delete plain[key];
            }
        }

        // 3) Documentos (Mongo) + enriquecimiento con nombres de User (uploaded_by y deleted_by)
        if (includeDocsFlag) {
            // Acepta employee_id como número o string
            const baseFilter = { employee_id: { $in: [Number(id), id.toString()] } };

            // Skill documents
            const skillFilter = { ...baseFilter };
            if (!includeDeletedFlag) {
                skillFilter.$and = [
                    { $or: [{ is_deleted: { $exists: false } }, { is_deleted: false }] },
                    { $or: [{ deleted_at: { $exists: false } }, { deleted_at: null }] }
                ];
            }

            // Employee documents (general). Considera voided y/o is_deleted
            const empDocFilter = { ...baseFilter };
            if (!includeDeletedFlag) {
                empDocFilter.$and = [
                    { $or: [{ voided: { $exists: false } }, { voided: false }] },
                    { $or: [{ is_deleted: { $exists: false } }, { is_deleted: false }] },
                    { $or: [{ deleted_at: { $exists: false } }, { deleted_at: null }] }
                ];
            }

            const [employeeDocs, skillDocs] = await Promise.all([
                EmployeeDocument
                    .find(
                        empDocFilter,
                        {
                            _id: 1,
                            original_filename: 1,
                            stored_filename: 1,
                            path: 1,
                            type: 1,
                            uploaded_at: 1,
                            uploaded_by: 1,
                            deleted_by: 1,
                            deleted_at: 1,
                            is_deleted: 1,
                            voided: 1
                        }
                    )
                    .lean()
                    .sort({ uploaded_at: -1 }),

                EmployeeSkillDocument
                    .find(
                        skillFilter,
                        {
                            _id: 1,
                            employee_skill_id: 1,
                            skill_id: 1,
                            level: 1,
                            filename: 1,
                            original_filename: 1,
                            path: 1,
                            uploaded_at: 1,
                            uploaded_by: 1,
                            deleted_by: 1,
                            deleted_at: 1,
                            is_deleted: 1
                        }
                    )
                    .lean()
                    .sort({ uploaded_at: -1 })
            ]);

            // IDs de usuarios involucrados (quien subió y quien eliminó)
            const userIds = [
                ...new Set(
                    [
                        ...skillDocs.map(d => d.uploaded_by),
                        ...employeeDocs.map(d => d.uploaded_by),
                        ...skillDocs.map(d => d.deleted_by),
                        ...employeeDocs.map(d => d.deleted_by)
                    ].filter(Boolean)
                )
            ];

            // IDs de skills para mapear nombres
            const skillIds = [
                ...new Set(skillDocs.map(d => d.skill_id).filter(Boolean))
            ];

            const [users, skills] = await Promise.all([
                userIds.length
                    ? User.findAll({
                        where: { id: userIds },
                        attributes: ['id', 'first_name', 'last_name', 'middle_name', 'username'],
                        paranoid: false // incluir soft-deleted users para auditoría
                    })
                    : Promise.resolve([]),
                skillIds.length
                    ? Skill.findAll({ where: { id: skillIds }, attributes: ['id', 'name'] })
                    : Promise.resolve([])
            ]);

            // formato de nombre corto: "Nombre Apellido"
            const formatUserDisplayName = (u) => {
                const firstName = (u.first_name || '').trim().split(/\s+/)[0] || '';
                const firstLast = (u.last_name || '').trim().split(/\s+/)[0] || '';
                const short = `${firstName} ${firstLast}`.trim();
                return short || u.username || u.email || `Usuario #${u.id}`;
            };

            const userMap = Object.fromEntries(users.map(u => [u.id, formatUserDisplayName(u)]));
            const skillMap = Object.fromEntries(skills.map(s => [s.id, s.name]));

            // --- Agrupar documentos de habilidades por (employee_skill_id|skill_id|level)
            const groupedMap = {};
            for (const d of skillDocs) {
                const key = `${d.employee_skill_id}|${d.skill_id}|${d.level}`;
                if (!groupedMap[key]) {
                    groupedMap[key] = {
                        employee_skill_id: d.employee_skill_id,
                        skill_id: d.skill_id,
                        skill_name: skillMap[d.skill_id] || 'Desconocido',
                        level: d.level,
                        items: []
                    };
                }

                const item = {
                    _id: d._id,
                    filename: d.filename,
                    original_filename: d.original_filename,
                    path: d.path,
                    uploaded_by: d.uploaded_by ?? null,
                    uploaded_by_name: d.uploaded_by ? (userMap[d.uploaded_by] || 'Desconocido') : null,
                    uploaded_at: d.uploaded_at
                };

                // si existe deleted_by/deleted_at, agrega también el nombre del usuario que lo eliminó
                if (d.deleted_by) {
                    item.deleted_by = d.deleted_by;
                    item.deleted_by_name = userMap[d.deleted_by] || 'Desconocido';
                }
                if (d.deleted_at) item.deleted_at = d.deleted_at;
                if (typeof d.is_deleted !== 'undefined' && includeDeletedFlag) {
                    item.is_deleted = !!d.is_deleted;
                }

                groupedMap[key].items.push(item);
            }

            // --- Documentos generales del empleado (con nombres de uploaded_by y deleted_by)
            const employeeDocsWithNames = employeeDocs.map(d => {
                const out = {
                    _id: d._id,
                    original_filename: d.original_filename,
                    stored_filename: d.stored_filename, // algunos modelos usan stored_filename
                    path: d.path,
                    type: d.type,
                    uploaded_at: d.uploaded_at,
                    uploaded_by: d.uploaded_by ?? null,
                    uploaded_by_name: d.uploaded_by ? (userMap[d.uploaded_by] || 'Desconocido') : null
                };
                if (d.deleted_by) {
                    out.deleted_by = d.deleted_by;
                    out.deleted_by_name = userMap[d.deleted_by] || 'Desconocido';
                }
                if (d.deleted_at) out.deleted_at = d.deleted_at;
                if (typeof d.is_deleted !== 'undefined' && includeDeletedFlag) {
                    out.is_deleted = !!d.is_deleted;
                }
                if (typeof d.voided !== 'undefined' && includeDeletedFlag) {
                    out.voided = !!d.voided;
                }
                return out;
            });

            plain.documents = {
                employee: employeeDocsWithNames,
                skills: Object.values(groupedMap)
            };
        }

        return res.json(plain);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al obtener el empleado' });
    }
};
const getOnePublic = async (req, res) => {
    try {
        const { code } = req.params;

        const employee = await Employee.findOne({
            where: { employee_code: code },
            include: [
                { model: Shift, attributes: ['name'], paranoid: false },
                { model: Position, attributes: ['name'], paranoid: false },
                { model: Area, attributes: ['name'], paranoid: false },
                { model: Class, attributes: ['name'], paranoid: false }
            ]
        });

        if (!employee) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        // 🔹 Documentos generales activos
        const empDocsFilter = {
            employee_id: employee.id.toString(),
            $and: [
                { $or: [{ voided: { $exists: false } }, { voided: false }] },
                { $or: [{ is_deleted: { $exists: false } }, { is_deleted: false }] },
                { $or: [{ deleted_at: { $exists: false } }, { deleted_at: null }] }
            ]
        };

        const employeeDocs = await EmployeeDocument.find(
            empDocsFilter,
            { original_filename: 1, stored_filename: 1, path: 1, type: 1, uploaded_at: 1 }
        ).lean();

        // 🔹 Documentos de habilidades activos
        const skillDocsFilter = {
            employee_id: employee.id.toString(),
            $and: [
                { $or: [{ is_deleted: { $exists: false } }, { is_deleted: false }] },
                { $or: [{ deleted_at: { $exists: false } }, { deleted_at: null }] }
            ]
        };

        const skillDocs = await EmployeeSkillDocument.find(
            skillDocsFilter,
            { original_filename: 1, filename: 1, path: 1, skill_id: 1, level: 1, uploaded_at: 1 }
        ).lean();

        // 🔹 Agrupar por skill_id y level
        const groupedMap = {};
        for (const d of skillDocs) {
            const key = `${d.skill_id}|${d.level}`;
            if (!groupedMap[key]) {
                groupedMap[key] = {
                    skill_id: d.skill_id,
                    level: d.level,
                    items: []
                };
            }
            groupedMap[key].items.push({
                original_filename: d.original_filename,
                filename: d.filename,
                path: d.path,
                uploaded_at: d.uploaded_at
            });
        }

        // 🔹 Enriquecer con nombres de skills (si los quieres mostrar)
        let skills = [];
        if (Object.keys(groupedMap).length > 0) {
            const skillIds = [...new Set(skillDocs.map(d => d.skill_id))];
            const skillModels = await Skill.findAll({
                where: { id: skillIds },
                attributes: ['id', 'name']
            });
            const skillMap = Object.fromEntries(skillModels.map(s => [s.id, s.name]));

            skills = Object.values(groupedMap).map(g => ({
                skill_id: g.skill_id,
                skill_name: skillMap[g.skill_id] || 'Desconocido',
                level: g.level,
                items: g.items
            }));
        }

        res.json({
            employee_code: employee.employee_code,
            full_name: employee.full_name,
            photo_url: employee.photo_url,
            hire_date: employee.hire_date,
            shift_name: employee.Shift?.name || null,
            position_name: employee.Position?.name || null,
            area_name: employee.Area?.name || null,
            class_name: employee.Class?.name || null,
            documents: {
                employee: employeeDocs,
                skills
            }
        });
    } catch (error) {
        console.error('Error en getOnePublic:', error);
        res.status(500).json({ message: 'Error al obtener el empleado público' });
    }
};


const getEmployeeAreasPublic = async (req, res) => {
    const { code } = req.params;

    try {
        const employee = await Employee.findOne({ where: { employee_code: code } });

        if (!employee) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        const skills = await EmployeeSkill.findAll({
            where: { employee_id: employee.id },
            include: {
                model: Skill,
                include: {
                    model: Operation,
                    include: {
                        model: Area
                    }
                }
            }
        });

        const areaMap = new Map();

        for (const s of skills) {
            const area = s.Skill?.Operation?.Area;
            if (area) areaMap.set(area.id, { id: area.id, name: area.name });
        }

        const uniqueAreas = Array.from(areaMap.values());

        res.json(uniqueAreas);
    } catch (error) {
        console.error('❌ Error al obtener áreas del empleado (público):', error);
        res.status(500).json({ message: 'Error al obtener áreas del empleado' });
    }
};
const create = async (req, res) => {
    try {
        const {
            employee_code,
            full_name,
            hire_date,
            shift_id,
            position_id,
            area_id,
            class_id
        } = req.body;

        const newEmployee = await Employee.create({
            employee_code,
            full_name,
            hire_date,
            shift_id,
            position_id,
            area_id,
            class_id
        });

        // 🔄 Obtener habilidades del área y asignarlas con nivel 0
        const operations = await Operation.findAll({
            where: { area_id },
            include: [{ model: Skill }]
        });

        const skillsToAssign = [];
        operations.forEach(op => {
            if (op.Skills && op.Skills.length > 0) {
                op.Skills.forEach(skill => {
                    skillsToAssign.push({
                        employee_id: newEmployee.id,
                        skill_id: skill.id,
                        level: 0,
                        updated_by: req.user.id,
                        updated_at: new Date()
                    });
                });
            }
        });

        if (skillsToAssign.length > 0) {
            await EmployeeSkill.bulkCreate(skillsToAssign);
        }

        await notifyUser({
            user_id: req.user.id,
            title: 'Empleado creado',
            message: `Empleado ${newEmployee.full_name} registrado (ID ${newEmployee.id})`
        });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'create',
            module: 'employees',
            description: `Empleado ${newEmployee.full_name} creado (ID ${newEmployee.id})`,
            ip: req.ip
        });

        res.status(201).json({ message: 'Empleado creado', employee: newEmployee });
    } catch (error) {
        console.error('Error al crear empleado:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error?.errors?.[0]?.path || 'campo único';
            return res.status(409).json({ message: `Ya existe un registro con ese ${field}` });
        }

        res.status(500).json({ message: 'Error al crear empleado' });
    }
};
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            employee_code,
            full_name,
            hire_date,
            shift_id,
            position_id,
            area_id,
            class_id
        } = req.body;

        const employee = await Employee.findOne({ where: { id } });
        if (!employee) return res.status(404).json({ message: 'Empleado no encontrado' });

        const areaChanged = employee.area_id !== area_id;

        await Employee.update({
            employee_code,
            full_name,
            hire_date,
            shift_id,
            position_id,
            area_id,
            class_id
        }, { where: { id } });

        // 🔄 Si se cambió el área, asignar nuevas habilidades (sin borrar las anteriores)
        if (areaChanged) {
            const operations = await Operation.findAll({
                where: { area_id },
                include: [{ model: Skill }]
            });

            const newSkillIds = operations.flatMap(op => op.Skills?.map(skill => skill.id) || []);

            if (newSkillIds.length > 0) {
                // Buscar qué habilidades YA tiene el empleado
                const existingSkills = await EmployeeSkill.findAll({
                    where: {
                        employee_id: id,
                        skill_id: newSkillIds
                    }
                });

                const existingSkillIds = existingSkills.map(es => es.skill_id);

                const skillsToAssign = newSkillIds
                    .filter(skillId => !existingSkillIds.includes(skillId))
                    .map(skillId => ({
                        employee_id: id,
                        skill_id: skillId,
                        level: 0,
                        updated_by: req.user.id,
                        updated_at: new Date()
                    }));

                if (skillsToAssign.length > 0) {
                    await EmployeeSkill.bulkCreate(skillsToAssign);
                }
            }
        }

        await notifyUser({
            user_id: req.user.id,
            title: 'Empleado actualizado',
            message: `Se actualizó el empleado con ID ${id}`
        });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'update',
            module: 'employees',
            description: `Empleado con ID ${id} actualizado`,
            ip: req.ip
        });

        res.json({ message: 'Empleado actualizado' });

    } catch (error) {
        console.error(error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error?.errors?.[0]?.path || 'campo único';
            return res.status(409).json({ message: `Ya existe un registro con ese ${field}` });
        }

        res.status(500).json({ message: 'Error al actualizar empleado' });
    }
};
const restore = async (req, res) => {
    try {
        const { id } = req.params;
        const empleado = await Employee.findByPk(id, {
            paranoid: false,
            include: [
                { model: Shift, attributes: ['id', 'name', 'start_time', 'end_time'], paranoid: false },
                { model: Position, attributes: ['id', 'name', 'description'], paranoid: false },
                { model: Area, attributes: ['id', 'name'], paranoid: false },
                { model: Class, attributes: ['id', 'name'], paranoid: false }
            ]
        });

        if (!empleado) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        // 👈 Restaurar
        await empleado.restore();

        // 👇 Normalizar claves (igual que en getOne)
        const plain = empleado.get({ plain: true });
        for (const key of ['Shift', 'Position', 'Area', 'Class']) {
            if (plain[key]) {
                plain[key.toLowerCase()] = plain[key];
                delete plain[key];
            }
        }

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'restore',
            module: 'employees',
            description: `Empleado con ID ${id} restaurado`,
            ip: req.ip
        });

        res.json({ message: 'Empleado restaurado', employee: plain });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al restaurar empleado' });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await Employee.findByPk(id);
        if (!employee) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        await employee.destroy(); // ✅ aquí Sequelize setea deleted_at

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'delete',
            module: 'employees',
            description: `Empleado con ID ${id} eliminado`,
            ip: req.ip
        });

        res.json({ message: 'Empleado eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar empleado' });
    }
};


const uploadPhoto = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findByPk(id);

        if (!employee) return res.status(404).json({ message: 'Empleado no encontrado' });

        // 🔥 Eliminar foto anterior si existe
        if (employee.photo_url) {
            const oldPath = path.join(__dirname, '../../uploads', employee.photo_url.replace('/uploads/', ''));
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // 📥 Guardar nueva foto
        employee.photo_url = `/uploads/employees/${id}/avatar/${req.file.filename}`;
        await employee.save();

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'upload_photo',
            module: 'employees',
            description: `Foto subida para empleado ID ${id}`,
            ip: req.ip
        });

        res.json({ message: 'Foto subida correctamente', photo_url: employee.photo_url });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al subir la foto' });
    }
};
const viewPhoto = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await Employee.findByPk(id);
        if (!employee || !employee.photo_url) {
            return res.status(404).send('Foto no disponible');
        }

        const filePath = path.join(__dirname, '../../', employee.photo_url);

        if (!fs.existsSync(filePath)) {
            return res.status(404).send('Archivo no encontrado');
        }

        res.sendFile(filePath);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener la foto');
    }
};

const uploadDocuments = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No se subieron archivos' });
        }

        const files = [];

        for (const file of req.files) {
            const doc = await EmployeeDocument.create({
                employee_id: Number(id),
                original_filename: file.originalname,
                stored_filename: file.filename,
                path: `/uploads/employees/${id}/documents/${file.filename}`, // 👈 corregido
                type: req.body.type || 'otro'
            });

            files.push(doc);
        }

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'upload_document',
            module: 'employees',
            description: `Se subieron ${files.length} documentos al empleado ID ${id}`,
            ip: req.ip
        });

        res.json({ message: 'Documentos subidos', files });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al subir documentos' });
    }
};

const checkEmployeeCode = async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) return res.status(400).json({ available: false, message: 'Código no proporcionado' });

        const exists = await Employee.findOne({ where: { employee_code: code } });

        if (exists) {
            return res.json({ available: false, message: 'Código ya está en uso' });
        }

        res.json({ available: true, message: 'Código disponible' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al verificar el código' });
    }
};
const getEmployeeAreas = async (req, res) => {
    const { employee_id } = req.params;

    try {
        const skills = await EmployeeSkill.findAll({
            where: { employee_id },
            include: {
                model: Skill,
                include: {
                    model: Operation,
                    include: {
                        model: Area
                    }
                }
            }
        });

        // Extraemos áreas únicas
        const areaMap = new Map();

        for (const s of skills) {
            const area = s.Skill?.Operation?.Area;
            if (area) areaMap.set(area.id, { id: area.id, name: area.name });
        }

        const uniqueAreas = Array.from(areaMap.values());

        res.json(uniqueAreas);
    } catch (error) {
        console.error('❌ Error al obtener áreas del empleado:', error);
        res.status(500).json({ message: 'Error al obtener áreas del empleado' });
    }
};


// Dar de baja documento general del empleado
const softDeleteEmployeeDocument = async (req, res) => {
    try {
        const { doc_id } = req.params;
        const doc = await EmployeeDocument.findById(doc_id);
        if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });

        if (doc.is_deleted) {
            return res.json({ message: 'El documento ya estaba dado de baja' });
        }

        doc.is_deleted = true;
        doc.deleted_at = new Date();
        doc.deleted_by = req.user.id;
        await doc.save();

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'void_document',
            module: 'employees',
            description: `Documento (MongoID: ${doc_id}) dado de baja`,
            ip: req.ip
        });

        return res.json({ message: 'Documento dado de baja' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al dar de baja documento' });
    }
};

// Eliminar permanentemente documento general del empleado
const hardDeleteEmployeeDocument = async (req, res) => {
    try {
        const { doc_id } = req.params;
        const doc = await EmployeeDocument.findById(doc_id);
        if (!doc) return res.status(404).json({ message: 'Documento no encontrado' });

        // 1) Borrar archivo físico
        // Tus documentos generales se guardan así: `/uploads/employees/:id/:filename`
        const filePath = path.join(__dirname, '././', doc.path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // 2) Borrar registro
        await EmployeeDocument.deleteOne({ _id: doc_id });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'hard_delete_document',
            module: 'employees',
            description: `Documento (MongoID: ${doc_id}) eliminado permanentemente`,
            ip: req.ip
        });

        return res.json({ message: 'Documento eliminado permanentemente' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al eliminar documento' });
    }
};


// 📌 DataTable serverSide para empleados
const getAllDatatable = async (req, res) => {
    try {
        const draw = parseInt(req.query.draw) || 1;
        const start = parseInt(req.query.start) || 0;
        const length = parseInt(req.query.length) || 10;
        const searchValue = (req.query.search?.value || '').trim();

        // Ordenamiento
        const orderColIndex = req.query['order[0][column]'] || 0;
        let orderColName = req.query[`columns[${orderColIndex}][data]`] || 'full_name';
        const orderDir = (req.query['order[0][dir]'] || 'asc').toUpperCase();

        // 👇 mapear alias de relaciones
        if (orderColName === 'shift_name') orderColName = Sequelize.col('Shift.name');
        if (orderColName === 'position_name') orderColName = Sequelize.col('Position.name');
        if (orderColName === 'area_name') orderColName = Sequelize.col('Area.name');
        if (orderColName === 'class_name') orderColName = Sequelize.col('Class.name');

        // Filtro por activos/inactivos
        const where = {};
        if (req.query.is_active !== undefined) {
            const active = req.query.is_active === 'true';
            where.deletedAt = active ? null : { [Op.not]: null };
        }

        // 🔍 Búsqueda global
        const searchConditions = [];
        if (searchValue) {
            searchConditions.push({ full_name: { [Op.like]: `%${searchValue}%` } });
            searchConditions.push({ employee_code: { [Op.like]: `%${searchValue}%` } });
            searchConditions.push(
                Sequelize.where(Sequelize.col('Shift.name'), { [Op.like]: `%${searchValue}%` })
            );
            searchConditions.push(
                Sequelize.where(Sequelize.col('Position.name'), { [Op.like]: `%${searchValue}%` })
            );
            searchConditions.push(
                Sequelize.where(Sequelize.col('Area.name'), { [Op.like]: `%${searchValue}%` })
            );
            searchConditions.push(
                Sequelize.where(Sequelize.col('Class.name'), { [Op.like]: `%${searchValue}%` })
            );
        }
        if (searchConditions.length > 0) where[Op.or] = searchConditions;

        // Totales
        const recordsTotal = await Employee.count({ paranoid: false });
        const recordsFiltered = await Employee.count({
            where,
            include: [
                { model: Shift, attributes: [], required: false },
                { model: Position, attributes: [], required: false },
                { model: Area, attributes: [], required: false },
                { model: Class, attributes: [], required: false }
            ],
            paranoid: false,
            distinct: true
        });

        // Query paginada
        const employees = await Employee.findAll({
            where,
            include: [
                { model: Shift, attributes: ['id', 'name'], paranoid: false },
                { model: Position, attributes: ['id', 'name'], paranoid: false },
                { model: Area, attributes: ['id', 'name'], paranoid: false },
                { model: Class, attributes: ['id', 'name'], paranoid: false }
            ],
            order: [[orderColName, orderDir]],
            offset: start,
            limit: length,
            paranoid: false
        });

        const data = employees.map(emp => ({
            id: emp.id,
            employee_code: emp.employee_code,
            full_name: emp.full_name,
            hire_date: emp.hire_date,
            photo_url: emp.photo_url,
            shift_id: emp.shift_id,
            shift_name: emp.Shift?.name || null,
            position_id: emp.position_id,
            position_name: emp.Position?.name || null,
            area_id: emp.area_id,
            area_name: emp.Area?.name || null,
            class_id: emp.class_id,
            class_name: emp.Class?.name || null,
            is_active: emp.deletedAt === null
        }));

        res.json({ draw, recordsTotal, recordsFiltered, data });
    } catch (err) {
        console.error('❌ Error en getAllDatatable empleados:', err);
        res.status(500).json({ message: 'Error al obtener empleados (datatable)' });
    }
};



module.exports = {
    getAll,
    getOne,
    create,
    update,
    delete: deleteEmployee,
    uploadPhoto,
    viewPhoto,
    uploadDocuments,
    checkEmployeeCode,
    getOnePublic,
    getEmployeeAreasPublic,
    getEmployeeAreas,
    softDeleteEmployeeDocument,
    hardDeleteEmployeeDocument,
    restore,
    getAllDatatable
};
