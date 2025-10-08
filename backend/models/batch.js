const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Seu arquivo de conexão com o banco

const Entry = sequelize.define('Entry', {
    id_entry: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    entry_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    invoice_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    quantity: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: false
    },
    unit_price: {
        type: DataTypes.DECIMAL(10, 0),
        allowNull: false
    }
    // ...outros campos como id_supplier, id_employee, etc.
}, {
    tableName: 'Entry', // Nome exato da tabela no banco
    timestamps: false // Se não houver colunas createdAt e updatedAt
});

module.exports = Entry;