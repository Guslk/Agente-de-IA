// // models/toolMovement.model.js
// const { DataTypes, Model } = require('sequelize');

// module.exports = (sequelize) => {
//     class ToolMovement extends Model {
//         static associate(models) {
//             this.belongsTo(models.Tool, { foreignKey: 'toolId', as: 'tool' });
//             this.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
//         }
//     }
//     ToolMovement.init({
//         id: { 
//             type: DataTypes.INTEGER, 
//             autoIncrement: true, 
//             primaryKey: true, 
//             field: 'id_movement' 
//         },
//         toolId: { 
//             type: DataTypes.INTEGER, 
//             allowNull: false, 
//             field: 'id_tool' 
//         },
//         employeeId: { 
//             type: DataTypes.INTEGER, 
//             allowNull: false, 
//             field: 'id_employee' 
//         },
//         movementType: { 
//             type: DataTypes.ENUM('Saída', 'Retorno'), 
//             allowNull: false, 
//             field: 'movement_type' 
//         },
//         movementDate: { 
//             type: DataTypes.DATE, 
//             defaultValue: DataTypes.NOW, 
//             field: 'movement_date' 
//         },
//         notes: { 
//             type: DataTypes.TEXT 
//         }
//     }, { sequelize, modelName: 'ToolMovement', tableName: 'tool_movement', timestamps: false });
//     return ToolMovement;
// };

// models/toolMovement.model.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class ToolMovement extends Model {
        static associate(models) {
            this.belongsTo(models.Tool, { foreignKey: 'toolId', as: 'tool' });
            this.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
        }
    }
    ToolMovement.init({
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true, 
            field: 'id_movement' 
        },
        toolId: { 
            type: DataTypes.INTEGER, 
            allowNull: false, 
            field: 'id_tool' 
        },
        employeeId: { 
            type: DataTypes.INTEGER, 
            allowNull: false, 
            field: 'id_employee' 
        },
        movementType: { 
            type: DataTypes.ENUM('Saída', 'Retorno'), 
            allowNull: false, 
            field: 'movement_type' 
        },
        movementDate: { 
            type: DataTypes.DATE, 
            defaultValue: DataTypes.NOW, 
            field: 'movement_date' 
        },
        notes: { 
            type: DataTypes.TEXT 
        }
    }, { 
        sequelize, 
        // ===============================================
        //           ESTA LINHA É A CORREÇÃO 👇
        // ===============================================
        modelName: 'ToolMovement', // Deve ser 'ToolMovement' (maiúsculo)
        tableName: 'tool_movement', 
        timestamps: false 
    });
    return ToolMovement;
};