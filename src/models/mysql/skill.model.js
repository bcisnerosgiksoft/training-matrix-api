const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');
const Operation = require('./operation.model');

const Skill = sequelize.define('Skill', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    operation_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: 'skills',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['operation_id'] },
        { fields: ['name'] }
    ]
});

Skill.belongsTo(Operation, { foreignKey: 'operation_id', constraints: false });

module.exports = Skill;
