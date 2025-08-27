const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shift.controller');
const { validateToken } = require('../middlewares/auth.middleware');
const { checkPermissions } = require('../middlewares/permissions.middleware');
const { validateShift } = require('../validators/shift.validator');
const { validateRequest } = require('../middlewares/validate.middleware');

// 🟢 Rutas protegidas con validaciones
router.get('/', validateToken, checkPermissions('read'), shiftController.getAll);
router.get('/:id', validateToken, checkPermissions('read'), shiftController.getOne);
router.post('/', validateToken, checkPermissions('write'), validateShift, validateRequest, shiftController.create);
router.put('/:id', validateToken, checkPermissions('edit'), validateShift, validateRequest, shiftController.update);
router.delete('/:id', validateToken, checkPermissions('delete'), shiftController.delete);
router.patch('/:id/restore', validateToken, checkPermissions('edit'), shiftController.restore);
module.exports = router;
