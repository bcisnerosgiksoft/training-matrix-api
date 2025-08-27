const { body } = require('express-validator');

const positionValidator = [
    body('name')
        .notEmpty()
        .withMessage('El nombre del puesto es obligatorio')
        .isLength({ min: 3 })
        .withMessage('El nombre debe tener al menos 3 caracteres'),

    body('description')
        .optional()
        .isLength({ max: 255 })
        .withMessage('La descripción no debe superar los 255 caracteres'),

    body('base_salary')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El salario base debe ser un número positivo')
];

module.exports = positionValidator;
