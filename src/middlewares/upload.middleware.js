const multer = require('multer');
const path = require('path');
const fs = require('fs');
const EmployeeSkill = require('../models/mysql/employeeSkill.model');

// 📷 Subida de foto de empleado
const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const employeeId = req.params.id || 'temp';
        const dir = path.join(__dirname, '../../uploads/employees', employeeId, 'avatar');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});
const uploadEmployee = multer({ storage: photoStorage });


// 📁 Subida de documentos generales del empleado
const documentsStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const employeeId = req.params.id || 'temp';
        const dir = path.join(__dirname, '../../uploads/employees', employeeId, 'documents');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `document-${uniqueSuffix}${ext}`);
    }
});
const uploadEmployeeDocuments = multer({ storage: documentsStorage });


// 📑 Subida de documentos de habilidades
const uploadSkillDocs = async (req, res, next) => {
    const { employee_skill_id } = req.params;

    try {
        const skill = await EmployeeSkill.findByPk(employee_skill_id);
        if (!skill) {
            return res.status(404).json({ message: 'Habilidad del empleado no encontrada' });
        }

        const employeeId = skill.employee_id;

        const skillStorage = multer.diskStorage({
            destination: (req, file, cb) => {
                const dir = path.join(__dirname, '../../uploads/employees', `${employeeId}`, 'skills', `${employee_skill_id}`);
                fs.mkdirSync(dir, { recursive: true });
                cb(null, dir);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                const ext = path.extname(file.originalname);

                // ✅ Limpia el fieldname (documents[0] → document)
                const baseName = file.fieldname.replace(/\[\d+\]/, '').replace(/s$/, '');
                cb(null, `${baseName}-${uniqueSuffix}${ext}`);
            }
        });

        const upload = multer({ storage: skillStorage }).any();

        upload(req, res, function (err) {
            if (err) {
                console.error('❌ Error en multer (skillDocs):', err);
                return res.status(500).json({ message: 'Error al subir documentos' });
            }

            req.employee_id_from_skill = employeeId;
            next();
        });
    } catch (err) {
        console.error('❌ Error al preparar subida de documentos:', err);
        res.status(500).json({ message: 'Error al preparar la subida' });
    }
};


module.exports = {
    uploadPhoto: uploadEmployee.single('photo'),                    // 📷 Subida de foto
    uploadDocuments: uploadEmployeeDocuments.array('documents', 10), // 📁 Documentos generales
    uploadSkillDocs                                                  // 📑 Documentos de habilidades
};
