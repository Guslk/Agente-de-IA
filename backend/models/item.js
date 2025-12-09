// models/item.model.js (em inglês)
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Item extends Model {
        static associate(models) {
            this.belongsTo(models.Stock, { foreignKey: 'stockId', as: 'stock' });
            this.hasMany(models.Entry, { foreignKey: 'itemId', as: 'entries' });
            this.hasMany(models.Output, { foreignKey: 'itemId', as: 'outputs' });
            this.hasMany(models.RequestItem, { foreignKey: 'itemId', as: 'requestItems' });
        }
    }
    Item.init({
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: 'id_item' },
        stockId: { type: DataTypes.INTEGER, allowNull: true, field: 'id_stock' },
        name: { type: DataTypes.STRING, allowNull: false },
        reservedQuantity: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
            field: 'reserved_quantity'
        },
        quantity: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        totalValue: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
            field: 'total_value'
        },
        lastModified: { type: DataTypes.DATE, allowNull: true, field: 'last_modified' },
        description: { type: DataTypes.TEXT, allowNull: true },
        position: { type: DataTypes.STRING, allowNull: false },
        code: { type: DataTypes.STRING(100), allowNull: true },
        unitOfMeasure: { type: DataTypes.STRING(50), allowNull: true, field: 'unit_of_measure' },
        minimumQuantity: { type: DataTypes.DECIMAL(10, 2), allowNull: true, field: 'minimum_quantity' },
        status: {
            type: DataTypes.ENUM('Ativo', 'Desativado', 'Excluido'),
            allowNull: false,
            defaultValue: 'Ativo'
        },
        maximumQuantity: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true, // Permite nulo se não houver limite
            field: 'maximum_quantity'
        }
    }, {
        sequelize,
        modelName: 'Item',
        // CORREÇÃO APLICADA AQUI 👇
        tableName: 'Item',
        timestamps: false
    });
    return Item;
};