const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const StockExit = sequelize.define('StockExit', {
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
        productionOrder: {
            type: DataTypes.STRING,
            allowNull: true
        },
        justification: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        batch: {
            type: DataTypes.STRING,
            allowNull: true
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
        // Foreign keys: userId, itemId, stockId will be added by associations.
    });

    return StockExit;
};