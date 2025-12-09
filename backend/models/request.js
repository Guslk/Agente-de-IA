// models/request.model.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Request extends Model {
        static associate(models) {
            // A Requisição pertence a um funcionário (quem pediu)
            this.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'requester' });
            // A Requisição pertence a um funcionário (quem aprovou)
            this.belongsTo(models.Employee, { foreignKey: 'approverId', as: 'approver' });
            // A Requisição tem muitos Itens
            this.hasMany(models.RequestItem, { foreignKey: 'requestId', as: 'items' });
        }
    }
    Request.init({
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, field: 'id_request' },
        employeeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: 'employee_id' },
        approverId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, field: 'approver_id' },
        status: { type: DataTypes.ENUM('Pendente', 'Finalizado', 'Cancelado'), allowNull: false, defaultValue: 'Pendente' },
        notes: { type: DataTypes.TEXT, allowNull: true },
        completedAt: { type: DataTypes.DATE, allowNull: true, field: 'completed_at' }
    }, { 
        sequelize, 
        modelName: 'Request', 
        tableName: 'Request', 
        timestamps: true, 
        createdAt: 'created_at', // Mapeia o 'createdAt' do Sequelize
        updatedAt: false // Desativa o 'updatedAt'
    });
    return Request;
};