const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');
const Employee = require('./employee.model');
const Skill = require('./skill.model');

const EmployeeSkill = sequelize.define('EmployeeSkill', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },
    skill_id: { type: DataTypes.INTEGER, allowNull: false },
    level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0, max: 4 }
    },
    updated_by: { type: DataTypes.INTEGER, allowNull: false },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'employee_skills',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['employee_id'] },
        { fields: ['skill_id'] },
        { unique: true, fields: ['employee_id', 'skill_id'] } // evita duplicidad entre empleado y habilidad
    ]
});

// Relaciones sin constraints duplicados
EmployeeSkill.belongsTo(Employee, { foreignKey: 'employee_id', constraints: false });
EmployeeSkill.belongsTo(Skill, { foreignKey: 'skill_id', constraints: false });

module.exports = EmployeeSkill;
