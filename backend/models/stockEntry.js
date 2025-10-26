// models/entry.model.js (em inglês)
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Entry extends Model {
        static associate(models) {
            this.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
            this.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
        }
    }
    Entry.init({
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: 'id_entry' },
        entryDate: { type: DataTypes.DATE, allowNull: false, field: 'entry_date' },
        invoiceNumber: { type: DataTypes.STRING, allowNull: false, field: 'invoice_number' },
        quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        unitPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
            field: 'unit_price'
        },
        supplierId: { type: DataTypes.INTEGER, allowNull: false, field: 'id_supplier' },
        itemId: { type: DataTypes.INTEGER, allowNull: false, field: 'id_item' }
    }, { sequelize, modelName: 'Entry', tableName: 'Entry', timestamps: false });
    return Entry;
};