const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Stock extends Model {
        static associate(models) {
            // Um estoque (Stock) pode ter muitos itens (Item)
            this.hasMany(models.Item, {
                foreignKey: 'id_stock',
                as: 'items'
            });
        }
    }

    Stock.init({
        id_stock: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'name_stock'
        }
        // Adicione outros campos da sua tabela Stock, se houver (ex: 'location', 'manager')
    }, {
        sequelize,
        modelName: 'Stock',
        tableName: 'Stock', // Nome exato da tabela no seu banco
        timestamps: false
    });

    return Stock;
};