// src/validators/employeeSkill.validator.js
const { body } = require('express-validator');

const employeeSkillValidator = [
    body('employee_id')
        .isInt({ min: 1 })
        .withMessage('El ID del empleado es obligatorio y debe ser un número entero'),

    body('skill_id')
        .isInt({ min: 1 })
        .withMessage('El ID de la habilidad es obligatorio y debe ser un número entero'),

    body('level')
        .isInt({ min: 0, max: 4 })
        .withMessage('El nivel debe ser un número entero entre 0 y 4')
];

module.exports = employeeSkillValidator;
