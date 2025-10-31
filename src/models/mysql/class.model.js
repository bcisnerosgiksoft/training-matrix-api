const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Class = sequelize.define('Class', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true }
}, {
    tableName: 'classes',
    timestamps: true,
    paranoid: true,
    indexes: [
        { unique: true, fields: ['name'] }
    ]
});

module.exports = Class;
