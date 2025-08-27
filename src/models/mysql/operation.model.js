// src/models/mysql/operation.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');
const Area = require('./area.model');

const Operation = sequelize.define('Operation', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    area_id: { type: DataTypes.INTEGER, allowNull: false },
    is_critical: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    tableName: 'operations',
    timestamps: true,
    paranoid: true
});

Operation.belongsTo(Area, { foreignKey: 'area_id' });

module.exports = Operation;
