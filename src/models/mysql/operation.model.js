const { DataTypes } = require('sequelize');
const sequelize = require('../../config/mysql');
const Area = require('./area.model');

const Operation = sequelize.define('Operation', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    area_id: { type: DataTypes.INTEGER, allowNull: false },
    is_critical: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    tableName: 'operations',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['area_id'] },
        { fields: ['is_critical'] }
    ]
});

// Evita duplicar constraints
Operation.belongsTo(Area, { foreignKey: 'area_id', constraints: false });

module.exports = Operation;
