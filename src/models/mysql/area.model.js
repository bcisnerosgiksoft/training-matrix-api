const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');

const Area = sequelize.define('Area', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    supervisor_id: { type: DataTypes.INTEGER, allowNull: true }
}, {
    tableName: 'areas',
    timestamps: true,
    paranoid: true,
    indexes: [
        { unique: true, fields: ['name'] },
        { fields: ['supervisor_id'] }
    ]
});

module.exports = Area;
