const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Role = sequelize.define('Role', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    can_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    can_write: { type: DataTypes.BOOLEAN, defaultValue: false },
    can_edit: { type: DataTypes.BOOLEAN, defaultValue: false },
    can_delete: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    tableName: 'roles',
    timestamps: true,
    paranoid: true,
    indexes: [
        { unique: true, fields: ['name'] }
    ]
});

module.exports = Role;
