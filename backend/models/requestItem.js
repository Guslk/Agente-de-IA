// models/requestItem.model.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class RequestItem extends Model {
        static associate(models) {
            this.belongsTo(models.Request, { foreignKey: 'requestId', as: 'request' });
            this.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
        }
    }
    RequestItem.init({
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: 'id_request_item' },
        requestId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'request_id' },
        itemId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'item_id' },
        quantityRequested: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'quantity_requested' },
        quantityReturned: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00, field: 'quantity_returned' }
    }, { 
        sequelize, 
        modelName: 'RequestItem', 
        tableName: 'Request_Item', 
        timestamps: false 
    });
    return RequestItem;
};