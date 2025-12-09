// models/output.model.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Output extends Model {
        static associate(models) {
            this.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
        }
    }
    Output.init({
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true, 
            field: 'id_exit' 
        },
       
        exitDate: { 
            type: DataTypes.DATE, 
            allowNull: false, 
            field: 'exit_date' 
        },
        justification: { 
            type: DataTypes.TEXT 
        },
        // ===============================================
        //             CORREÇÃO APLICADA AQUI 👇
        // ===============================================
        quantity: { 
            type: DataTypes.DECIMAL(10, 0), 
            allowNull: false,
            // Maps the 'quantity' property to the 'quantify' column in the database
            field: 'quantify'
        },
        unitPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
            field: 'unit_price' // Mapeia 'unitPrice' (JS) para 'unit_price' (SQL)
        },
        productionOrder: { 
            type: DataTypes.STRING, 
            field: 'production_order' 
        },
        itemId: { 
            type: DataTypes.INTEGER, 
            allowNull: false, 
            field: 'id_item' 
        }
    }, { 
        sequelize, 
        modelName: 'Output', 
        tableName: 'Output', 
        timestamps: false 
    });
    return Output;
};