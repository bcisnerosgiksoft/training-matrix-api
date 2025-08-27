const express = require('express');
const router = express.Router();
const { validateToken } = require('../middlewares/auth.middleware');
const { checkPermissions } = require('../middlewares/permissions.middleware');
const positionController = require('../controllers/position.controller');

const positionValidator = require('../validators/position.validator');
const { validateRequest } = require('../middlewares/validate.middleware');

// Ruta para obtener todas las posiciones
router.get('/', validateToken, checkPermissions('read'), positionController.getAll);

// Ruta para obtener una posición por ID
router.get('/:id', validateToken, checkPermissions('read'), positionController.getOne);

// Ruta para crear una nueva posición
router.post(
    '/',
    validateToken,
    checkPermissions('write'),
    positionValidator,
    validateRequest,
    positionController.create
);

// Ruta para actualizar una posición
router.put(
    '/:id',
    validateToken,
    checkPermissions('edit'),
    positionValidator,
    validateRequest,
    positionController.update
);


// Ruta para eliminar una posición
router.delete('/:id', validateToken, checkPermissions('delete'), positionController.delete);
router.patch('/:id/restore', validateToken, checkPermissions('edit'), positionController.restore);
module.exports = router;
