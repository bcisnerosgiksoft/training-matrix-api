// src/validators/employee.validator.js
const { body } = require('express-validator');

const employeeValidationRules = [
    body('employee_code')
        .notEmpty()
        .withMessage('El número de empleado es obligatorio'),

    body('full_name')
        .notEmpty()
        .withMessage('El nombre completo es obligatorio'),

    body('position_id')
        .isInt({ min: 1 })
        .withMessage('La posición es obligatoria y debe ser un número válido'),

    body('shift_id')
        .isInt({ min: 1 })
        .withMessage('El turno es obligatorio y debe ser un número válido'),

    body('area_id')
        .isInt({ min: 1 })
        .withMessage('El área es obligatoria y debe ser un número válido'),

    body('class_id')
        .isInt({ min: 1 })
        .withMessage('La clase es obligatoria y debe ser un número válido'),

    body('hire_date')
        .notEmpty()
        .isISO8601()
        .withMessage('La fecha de contratación es obligatoria y debe ser válida')
];

module.exports = employeeValidationRules;
