const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Position = require('./position.model');
const Shift = require('./shift.model');
const Area = require('./area.model');
const Class = require('./class.model');

const Employee = sequelize.define('Employee', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employee_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    full_name: { type: DataTypes.STRING(150), allowNull: false },
    hire_date: { type: DataTypes.DATEONLY, allowNull: false },
    photo_url: { type: DataTypes.STRING(255), allowNull: true },
    shift_id: { type: DataTypes.INTEGER, allowNull: false },
    position_id: { type: DataTypes.INTEGER, allowNull: false },
    area_id: { type: DataTypes.INTEGER, allowNull: false },
    class_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: 'employees',
    timestamps: true,
    paranoid: true,
    indexes: [
        { unique: true, fields: ['employee_code'] },
        { fields: ['shift_id'] },
        { fields: ['position_id'] },
        { fields: ['area_id'] },
        { fields: ['class_id'] }
    ]
});

// Relaciones (sin constraints para evitar duplicados)
Employee.belongsTo(Position, { foreignKey: 'position_id', constraints: false });
Employee.belongsTo(Shift, { foreignKey: 'shift_id', constraints: false });
Employee.belongsTo(Area, { foreignKey: 'area_id', constraints: false });
Employee.belongsTo(Class, { foreignKey: 'class_id', constraints: false });

module.exports = Employee;
