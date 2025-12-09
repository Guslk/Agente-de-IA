// models/stock.model.js (Versão Final e Corrigida)
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Stock extends Model {
        static associate(models) {
            this.hasMany(models.Item, { foreignKey: 'stockId', as: 'items' });
        }
    }
    Stock.init({
        // A propriedade no JS será 'id'
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true, 
            // Mas no banco de dados, a coluna é 'id_stock'
            field: 'id_stock' 
        },
        // A propriedade no JS será 'name'
        name: { 
            type: DataTypes.STRING, 
            allowNull: false, 
            // Mas no banco de dados, a coluna é 'name_stock'
            field: 'name_stock' 
        }
    }, { sequelize, modelName: 'Stock', tableName: 'Stock', timestamps: false });
    return Stock;
};