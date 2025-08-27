const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');
const Role = require('./role.model');

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_code: { type: DataTypes.STRING, allowNull: false, unique: true },
    first_name: { type: DataTypes.STRING, allowNull: false },
    last_name: { type: DataTypes.STRING, allowNull: false },
    middle_name: { type: DataTypes.STRING, allowNull: true },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: 'users',
    timestamps: true,
    paranoid: true
});

// Relación con roles
User.belongsTo(Role, { foreignKey: 'role_id' });

module.exports = User;
