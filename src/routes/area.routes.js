const express = require('express');
const router = express.Router();
const areaController = require('../controllers/area.controller');
const { validateToken } = require('../middlewares/auth.middleware');
const { checkPermissions } = require('../middlewares/permissions.middleware');
const { areaValidator } = require('../validators/area.validator');
const { validateRequest } = require('../middlewares/validate.middleware');

// 🔐 Rutas protegidas con validación y permisos
router.get('/', validateToken, checkPermissions('read'), areaController.getAll);

// 👉 Nueva ruta para DataTables (serverSide)
router.get('/datatable', validateToken, checkPermissions('read'), areaController.getAllDatatable);

router.get('/:id', validateToken, checkPermissions('read'), areaController.getOne);
router.post('/', validateToken, checkPermissions('write'), areaValidator, validateRequest, areaController.create);
router.put('/:id', validateToken, checkPermissions('edit'), areaValidator, validateRequest, areaController.update);
router.delete('/:id', validateToken, checkPermissions('delete'), areaController.delete);

// Restore área (activar de nuevo)
router.patch('/:id/restore', validateToken, checkPermissions('edit'), areaController.restore);

module.exports = router;
