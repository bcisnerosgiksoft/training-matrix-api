// src/models/mysql/skill.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');
const Operation = require('./operation.model');

const Skill = sequelize.define('Skill', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    operation_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: 'skills',
    timestamps: true,
    paranoid: true
});

// Relación con operación
Skill.belongsTo(Operation, { foreignKey: 'operation_id' });

module.exports = Skill;
