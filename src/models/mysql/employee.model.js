// src/models/mysql/employee.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Position = require('./position.model');
const Shift = require('./shift.model');
const Area = require('./area.model');
const Class = require('./class.model');

const Employee = sequelize.define('Employee', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_code: { type: DataTypes.STRING, allowNull: false, unique: true },
    full_name: { type: DataTypes.STRING, allowNull: false },
    hire_date: { type: DataTypes.DATE, allowNull: false },
    photo_url: { type: DataTypes.STRING, allowNull: true },
    shift_id: { type: DataTypes.INTEGER, allowNull: false },
    position_id: { type: DataTypes.INTEGER, allowNull: false },
    area_id: { type: DataTypes.INTEGER, allowNull: false },
    class_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: 'employees',
    timestamps: true,
    paranoid: true
});

// Relaciones
Employee.belongsTo(Position, { foreignKey: 'position_id' });
Employee.belongsTo(Shift, { foreignKey: 'shift_id' });
Employee.belongsTo(Area, { foreignKey: 'area_id' });
Employee.belongsTo(Class, { foreignKey: 'class_id' });

module.exports = Employee;
