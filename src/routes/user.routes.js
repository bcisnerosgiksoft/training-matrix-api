const express = require('express');
const router = express.Router();

const { validateToken } = require('../middlewares/auth.middleware');
const { checkPermissions } = require('../middlewares/permissions.middleware');
const userController = require('../controllers/user.controller');
const { createUserValidator, updateUserValidator } = require('../validators/user.validator');
const { validateRequest } = require('../middlewares/validate.middleware');

router.get('/', validateToken, checkPermissions('read'), userController.getAll);
router.get('/:id', validateToken, checkPermissions('read'), userController.getOne);

router.post(
    '/',
    validateToken,
    checkPermissions('write'),
    createUserValidator,
    validateRequest,
    userController.create
);

router.put(
    '/:id',
    validateToken,
    checkPermissions('edit'),
    updateUserValidator,
    validateRequest,
    userController.update
);

router.delete('/:id', validateToken, checkPermissions('delete'), userController.softDelete);

module.exports = router;
