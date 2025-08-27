const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Position = sequelize.define('Position', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
    base_salary: { type: DataTypes.FLOAT, allowNull: true }  // Puedes agregar un salario base por posición si lo deseas
}, {
    tableName: 'positions',
    timestamps: true,
    paranoid: true
});

module.exports = Position;
