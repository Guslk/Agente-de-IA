// models/tool.model.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Tool extends Model {
        static associate(models) {
            // Uma ferramenta pode ter muitas movimentações
            this.hasMany(models.ToolMovement, { foreignKey: 'toolId', as: 'movements' });
        }
    }
    Tool.init({
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true, 
            field: 'id_tool' 
        },
        name: { 
            type: DataTypes.STRING, 
            allowNull: false, 
            field: 'name_tool' 
        },
        code: { 
            type: DataTypes.STRING(100), 
            allowNull: true, 
            unique: true, 
            field: 'code_tools' 
        },
        status: { 
            type: DataTypes.ENUM('Em estoque', 'Em uso', 'Em manutenção', 'Desativada', "Excluido"),
            allowNull: false, 
            defaultValue: 'Em estoque' 
        }
    }, { sequelize, modelName: 'Tool', tableName: 'tool', timestamps: false });
    return Tool;
};