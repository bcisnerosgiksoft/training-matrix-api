const { body } = require('express-validator');

const validateShift = [
    body('name')
        .notEmpty().withMessage('El nombre del turno es obligatorio')
        .isString().withMessage('El nombre del turno debe ser texto'),

    body('start_time')
        .notEmpty().withMessage('La hora de inicio es obligatoria')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('La hora de inicio debe tener el formato HH:mm'),

    body('end_time')
        .notEmpty().withMessage('La hora de fin es obligatoria')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('La hora de fin debe tener el formato HH:mm')
];

module.exports = { validateShift };
