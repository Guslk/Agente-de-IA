const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Item extends Model {
        static associate(models) {
            // Define a associação aqui:
            // Um item tem muitas entradas de estoque (StockEntry)
            this.hasMany(models.StockEntry, {
                foreignKey: 'itemId', // Nome da chave estrangeira na tabela StockEntry
                as: 'entries'         // Apelido para a associação (opcional)
            });
        }
    }

    Item.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        unitOfMeasure: {
            type: DataTypes.STRING,
            allowNull: false
        },
        minimumQuantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Item',
        // Se sua tabela não tiver `createdAt` e `updatedAt`, adicione:
        // timestamps: false 
    });

    return Item;
};