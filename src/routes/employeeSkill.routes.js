// src/routes/employeeSkill.routes.js
const express = require('express');
const router = express.Router();

const { validateToken } = require('../middlewares/auth.middleware');
const { checkPermissions } = require('../middlewares/permissions.middleware');
const { uploadSkillDocs } = require('../middlewares/upload.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');

const employeeSkillValidator = require('../validators/employeeSkill.validator');

const {
    assignOrUpdateSkill,
    getEmployeeSkills,
    deleteEmployeeSkill,
    getSkillsByArea,
    getEmployeeSkillsPublic
} = require('../controllers/employeeSkill.controller');

const {
    uploadDocuments,
    getSkillDocuments
} = require('../controllers/employeeSkillDocument.controller');

// 📥 Asignar o actualizar nivel en habilidad
router.post(
    '/',
    validateToken,
    checkPermissions('edit'),
    uploadSkillDocs, // Para subir 1 o varios documentos
    employeeSkillValidator,
    validateRequest,
    assignOrUpdateSkill
);

// ⚠️ Debe ir antes del '/:employee_id' que requiere token
router.get('/public/:code', getEmployeeSkillsPublic);


// 📄 Obtener habilidades de un empleado
router.get(
    '/:employee_id',
    validateToken,
    checkPermissions('read'),
    getEmployeeSkills
);
// Habilidades de todos los empleados en un área
router.get(
    '/area/:area_id',
    validateToken,
    checkPermissions('read'),
    getSkillsByArea
);

// 🗑️ Eliminar una habilidad asignada
router.delete(
    '/:employee_id/:skill_id',
    validateToken,
    checkPermissions('delete'),
    deleteEmployeeSkill
);

// 📤 Subir documentos a una habilidad asignada
router.post('/:employee_skill_id/documents', validateToken, checkPermissions('edit'), uploadSkillDocs, uploadDocuments);

// 📄 Obtener documentos de una habilidad asignada
router.get(
    '/:employee_skill_id/documents',
    validateToken,
    checkPermissions('read'),
    getSkillDocuments
);


module.exports = router;
