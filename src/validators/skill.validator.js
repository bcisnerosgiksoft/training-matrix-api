const { body } = require('express-validator');

const createSkillValidator = [
    body('name')
        .notEmpty()
        .withMessage('El nombre de la habilidad es obligatorio'),

    body('operation_id')
        .notEmpty()
        .withMessage('La operación a la que pertenece es obligatoria')
        .isInt({ min: 1 })
        .withMessage('El ID de operación debe ser válido'),
];

const updateSkillValidator = [
    body('name')
        .optional()
        .notEmpty()
        .withMessage('El nombre de la habilidad no puede estar vacío'),

    body('operation_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('El ID de operación debe ser válido si se incluye'),
];

module.exports = {
    createSkillValidator,
    updateSkillValidator
};
