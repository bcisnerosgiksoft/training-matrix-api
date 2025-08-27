// src/validators/user.validator.js
const { body } = require('express-validator');

const createUserValidator = [
    body('first_name').notEmpty().withMessage('El nombre es obligatorio'),
    body('last_name').notEmpty().withMessage('El apellido paterno es obligatorio'),
    body('username').notEmpty().withMessage('El nombre de usuario es obligatorio'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('role_id').isInt().withMessage('El rol es obligatorio y debe ser un número')
];

const updateUserValidator = [
    body('first_name').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('last_name').optional().notEmpty().withMessage('El apellido paterno no puede estar vacío'),
    body('username').optional().notEmpty().withMessage('El nombre de usuario no puede estar vacío'),
    body('password').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('role_id').optional().isInt().withMessage('El rol debe ser un número')
];

module.exports = {
    createUserValidator,
    updateUserValidator
};