const express = require('express');
const router = express.Router();
const { validateToken } = require('../middlewares/auth.middleware');
const { checkPermissions } = require('../middlewares/permissions.middleware');
const skillController = require('../controllers/skill.controller');
const { createSkillValidator, updateSkillValidator } = require('../validators/skill.validator');
const { validateRequest } = require('../middlewares/validate.middleware');

// 📌 DataTable (server-side)
router.get('/datatable', validateToken, checkPermissions('read'), skillController.getAllDatatable);

// 📌 Restore habilidad eliminada
router.patch('/:id/restore', validateToken, checkPermissions('edit'), skillController.restore);

// CRUD básico
router.get('/', validateToken, checkPermissions('read'), skillController.getAll);
router.get('/:id', validateToken, checkPermissions('read'), skillController.getOne);
router.post('/', validateToken, checkPermissions('write'), createSkillValidator, validateRequest, skillController.create);
router.put('/:id', validateToken, checkPermissions('edit'), updateSkillValidator, validateRequest, skillController.update);
router.delete('/:id', validateToken, checkPermissions('delete'), skillController.delete);

module.exports = router;
