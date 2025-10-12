const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Item extends Model {
        static associate(models) {
//             // Associação com StockEntry (movimentações)
//             this.hasMany(models.StockEntry, {
//                 foreignKey: 'itemId', // Chave estrangeira em StockEntry
//                 as: 'entries'
//             });

            // Associação com Stock (armazém/depósito)
            this.belongsTo(models.Stock, {
                foreignKey: 'id_stock', // Chave estrangeira nesta tabela (Item)
                as: 'stock'
            });
        }
    }

    Item.init({
        // Mapeado para a coluna 'id_item'
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            field: 'id_item'
        },
        // Mapeado para a coluna 'id_stock'
        id_stock: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: 'name' 
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        position: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        code: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        // Mapeado para a coluna 'unit_of_measure'
        unitOfMeasure: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'unit_of_measure'
        },
        // Mapeado para a coluna 'minimum_quantity'
        minimumQuantity: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            field: 'minimum_quantity'
        }
        // Seus campos 'category' e 'department' não estão na imagem.
        // Se você os adicionou à tabela, eles devem ser incluídos aqui também.
    }, {
        sequelize,
        modelName: 'Item',
        tableName: 'Item', // Nome exato da sua tabela
        timestamps: false  // Sua tabela não tem as colunas createdAt e updatedAt
    });

    return Item;
};