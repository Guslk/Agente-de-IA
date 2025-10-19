// models/item.model.js (em inglês)
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Item extends Model {
        static associate(models) {
            this.belongsTo(models.Stock, { foreignKey: 'stockId', as: 'stock' });
            this.hasMany(models.Entry, { foreignKey: 'itemId', as: 'entries' });
            this.hasMany(models.Output, { foreignKey: 'itemId', as: 'outputs' });
        }
    }
    Item.init({
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: 'id_item' },
        stockId: { type: DataTypes.INTEGER, allowNull: true, field: 'id_stock' },
        name: { type: DataTypes.STRING, allowNull: false },
        quantity: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        description: { type: DataTypes.TEXT, allowNull: true },
        position: { type: DataTypes.STRING, allowNull: false },
        code: { type: DataTypes.STRING(100), allowNull: true },
        unitOfMeasure: { type: DataTypes.STRING(50), allowNull: true, field: 'unit_of_measure' },
        minimumQuantity: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'minimum_quantity' }
    }, { 
        sequelize, 
        modelName: 'Item', 
        // CORREÇÃO APLICADA AQUI 👇
        tableName: 'Item', 
        timestamps: false 
    });
    return Item;
};