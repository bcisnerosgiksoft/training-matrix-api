const express = require('express');
const router = express.Router();
const { validateToken } = require('../middlewares/auth.middleware');
const { checkPermissions } = require('../middlewares/permissions.middleware');
const { operationValidator } = require('../validators/operation.validator');
const { validateRequest } = require('../middlewares/validate.middleware');
const controller = require('../controllers/operation.controller');

// ⚡ DataTables
router.get('/datatable', validateToken, checkPermissions('read'), controller.getAllDatatable);

// ⚡ Restore operación
router.patch('/:id/restore', validateToken, checkPermissions('edit'), controller.restore);

router.get('/', validateToken, checkPermissions('read'), controller.getAll);
router.get('/by-area/:area_id', validateToken, checkPermissions('read'), controller.getByArea);
router.get('/:id', validateToken, checkPermissions('read'), controller.getOne);

router.post('/', validateToken, checkPermissions('write'), operationValidator, validateRequest, controller.create);
router.put('/:id', validateToken, checkPermissions('edit'), operationValidator, validateRequest, controller.update);
router.delete('/:id', validateToken, checkPermissions('delete'), controller.delete);

module.exports = router;
