const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class StockEntry extends Model {
        static associate(models) {
            // Define a associação aqui:
            // Uma entrada de estoque pertence a um item
            this.belongsTo(models.Item, {
                foreignKey: 'itemId', // Nome da chave que será criada nesta tabela
                as: 'item'            // Apelido para a associação (opcional)
            });
        }
    }

    StockEntry.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        movementDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        invoiceNumber: {
            type: DataTypes.STRING,
            allowNull: true
        },
        purchaseOrder: {
            type: DataTypes.STRING,
            allowNull: true
        },
        batch: {
            type: DataTypes.STRING,
            allowNull: true
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        unitPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'StockEntry',
        // timestamps: false
    });

    return StockEntry;
};