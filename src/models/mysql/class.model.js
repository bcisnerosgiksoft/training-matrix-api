// src/models/mysql/class.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Class = sequelize.define('Class', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true }
}, {
    tableName: 'classes',
    timestamps: true,
    paranoid: true
});

module.exports = Class;
