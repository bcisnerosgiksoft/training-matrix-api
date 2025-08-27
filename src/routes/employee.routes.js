const express = require('express');
const router = express.Router();
const { validateToken } = require('../middlewares/auth.middleware');
const { checkPermissions } = require('../middlewares/permissions.middleware');
const employeeController = require('../controllers/employee.controller');
const { uploadPhoto, uploadDocuments } = require('../middlewares/upload.middleware');
const employeeValidation = require('../validators/employee.validator');
const { validateRequest } = require('../middlewares/validate.middleware');

// ⬇️ handlers para delete de documentos de HABILIDAD
const {
    softDeleteEmployeeSkillDocument,
    hardDeleteEmployeeSkillDocument
} = require('../controllers/employeeSkillDocument.controller');
const shiftController = require("../controllers/shift.controller");

// 📦 Rutas principales
router.get('/', validateToken, checkPermissions('read'), employeeController.getAll);

// 📊 DataTable (serverSide)
router.get('/datatable', validateToken, checkPermissions('read'), employeeController.getAllDatatable);


// ✅ Public
router.get('/public/:code/areas', employeeController.getEmployeeAreasPublic);
router.get('/public/:code', employeeController.getOnePublic);

// ✅ Utilidades que NO deben chocar con :id
router.get('/check-code', validateToken, checkPermissions('read'), employeeController.checkEmployeeCode);

// 🧑‍💼 Empleado por id
router.get('/:id', validateToken, checkPermissions('read'), employeeController.getOne);
router.post('/', validateToken, checkPermissions('write'), employeeValidation, validateRequest, employeeController.create);
router.put('/:id', validateToken, checkPermissions('edit'), employeeValidation, validateRequest, employeeController.update);
router.delete('/:id', validateToken, checkPermissions('delete'), employeeController.delete);

// 🖼️ Foto
router.post('/:id/photo', validateToken, checkPermissions('edit'), uploadPhoto, employeeController.uploadPhoto);
router.get('/:id/photo-view', validateToken, employeeController.viewPhoto);

// 📁 Documentos generales del empleado
router.post('/:id/documents', validateToken, checkPermissions('edit'), uploadDocuments, employeeController.uploadDocuments);

// 🗂️ Áreas del empleado
router.get('/:employee_id/areas', validateToken, checkPermissions('read'), employeeController.getEmployeeAreas);

// 🗑️ Soft/Hard delete de documentos GENERALES (una sola vez)
router.patch('/:employee_id/documents/:doc_id/void', validateToken, checkPermissions('delete'), employeeController.softDeleteEmployeeDocument);
router.delete('/:employee_id/documents/:doc_id',     validateToken, checkPermissions('delete'), employeeController.hardDeleteEmployeeDocument);

// 🗑️ Soft/Hard delete de documentos por HABILIDAD (coincide con tu FE)
router.patch('/:employee_id/skill-documents/:doc_id/void', validateToken, checkPermissions('delete'), softDeleteEmployeeSkillDocument);
router.delete('/:employee_id/skill-documents/:doc_id',     validateToken, checkPermissions('delete'), hardDeleteEmployeeSkillDocument);

router.patch('/:id/restore', validateToken, checkPermissions('edit'), employeeController.restore);

module.exports = router;
