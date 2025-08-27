// src/validators/operation.validator.js
const { body } = require('express-validator');

const operationValidator = [
    body('name')
        .notEmpty().withMessage('El nombre de la operación es obligatorio'),

    body('area_id')
        .isInt({ min: 1 }).withMessage('El área es obligatoria y debe ser válida'),

    body('is_critical')
        .optional().isBoolean().withMessage('El campo crítico debe ser booleano')
];

module.exports = { operationValidator };
