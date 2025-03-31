const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Provider = require('./provider');

const Billing = sequelize.define('Billing', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    provider_id: {  
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
            model: Provider,
            key: 'id'
        }
    },
    consultation_id: {  
        type: DataTypes.INTEGER,  
        allowNull: false  
    },
    duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    billing_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    date_range: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, { 
    timestamps: true
});

module.exports = Billing;
