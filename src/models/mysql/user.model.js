const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');
const Role = require('./role.model');

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    first_name: { type: DataTypes.STRING(100), allowNull: false },
    last_name: { type: DataTypes.STRING(100), allowNull: false },
    middle_name: { type: DataTypes.STRING(100), allowNull: true },
    username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    role_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    indexes: [
        { unique: true, fields: ['user_code'] },
        { unique: true, fields: ['username'] },
        { fields: ['role_id'] }
    ]
});

User.belongsTo(Role, { foreignKey: 'role_id', constraints: false });

module.exports = User;
