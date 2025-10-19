// models/supplier.model.js
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Supplier extends Model {
  
        static associate(models) {
            this.hasMany(models.Entry, {
                foreignKey: 'supplierId',
                as: 'entries'
            });
        }
    }

    Supplier.init({
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            field: 'id_supplier' // Mapeia para a coluna 'id_supplier'
        },
        // Mapeamos 'company_name' para a propriedade 'name' para padronizar com os outros modelos
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'company_name'
        },
        contactPerson: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'contact_person'
        },
        phoneNumber: {
            type: DataTypes.STRING(50),
            allowNull: true,
            field: 'phone_number'
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: true
            }
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Supplier',
        tableName: 'Supplier', // Nome exato da sua tabela
        timestamps: false      // Sua tabela não tem colunas createdAt/updatedAt
    });

    return Supplier;
};

