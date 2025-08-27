// src/models/mysql/shift.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Shift = sequelize.define('Shift', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    start_time: { type: DataTypes.TIME, allowNull: false },
    end_time: { type: DataTypes.TIME, allowNull: false }
}, {
    tableName: 'shifts',
    timestamps: true,
    paranoid: true
});

module.exports = Shift;
