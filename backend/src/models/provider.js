const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Provider = sequelize.define('Provider', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    specialization: { type: DataTypes.STRING, allowNull: false },
    taxonomy: { type: DataTypes.STRING, allowNull: false },
    npiNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    state: { type: DataTypes.STRING, allowNull: false },
    licenseNumber: { type: DataTypes.STRING, allowNull: true },
    licenseExpiryDate: { type: DataTypes.DATE, allowNull: false },
    verified: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { timestamps: true });

module.exports = Provider;
