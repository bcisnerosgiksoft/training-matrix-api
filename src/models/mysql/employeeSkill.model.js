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
    paranoid: true
});

// Relaciones
EmployeeSkill.belongsTo(Employee, { foreignKey: 'employee_id' });
EmployeeSkill.belongsTo(Skill, { foreignKey: 'skill_id' });

module.exports = EmployeeSkill;
