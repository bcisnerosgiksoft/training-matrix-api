// src/validators/area.validator.js
const { body } = require('express-validator');

const areaValidator = [
    body('name')
        .notEmpty()
        .withMessage('El nombre del área es obligatorio')
        .isLength({ min: 3 })
        .withMessage('El nombre debe tener al menos 3 caracteres'),

    body('supervisor_id')
        .optional({ nullable: true }) // 👈 permite null o undefined
        .isInt({ min: 1 })
        .withMessage('El supervisor debe ser un ID válido si se proporciona'),
];

module.exports = { areaValidator };
