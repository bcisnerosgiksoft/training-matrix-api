const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Position = sequelize.define('Position', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: true },
    base_salary: { type: DataTypes.FLOAT, allowNull: true }
}, {
    tableName: 'positions',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['name'] }
    ]
});

module.exports = Position;
