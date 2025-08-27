const { body } = require('express-validator');

const classValidator = [
    body('name')
        .notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ max: 100 }).withMessage('El nombre no debe superar los 100 caracteres')
];

module.exports = { classValidator };
