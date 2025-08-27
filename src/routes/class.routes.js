const express = require('express');
const router = express.Router();
const { validateToken } = require('../middlewares/auth.middleware');
const { checkPermissions } = require('../middlewares/permissions.middleware');
const classController = require('../controllers/class.controller');
const { classValidator } = require('../validators/class.validator');
const { validateRequest } = require('../middlewares/validate.middleware');

router.get('/', validateToken, checkPermissions('read'), classController.getAll);
router.get('/:id', validateToken, checkPermissions('read'), classController.getOne);
router.post('/', validateToken, checkPermissions('write'), classValidator, validateRequest, classController.create);
router.put('/:id', validateToken, checkPermissions('edit'), classValidator, validateRequest, classController.update);
router.delete('/:id', validateToken, checkPermissions('delete'), classController.delete);
router.patch('/:id/restore', validateToken, checkPermissions('edit'), classController.restore);
module.exports = router;
