'use strict';
const { Model } = require('sequelize');

// O arquivo agora exporta uma função que recebe 'sequelize' e 'DataTypes' como parâmetros
module.exports = (sequelize, DataTypes) => {
  
  // Usamos o padrão de classes do Sequelize (Model.init)
  class Entry extends Model {
    static associate(models) {
      // Defina as associações aqui.
      // Exemplo: Uma entrada pertence a um Item e a um Fornecedor.
      // this.belongsTo(models.Item, { foreignKey: 'itemId' });
      // this.belongsTo(models.Supplier, { foreignKey: 'supplierId' });
    }
  }

  Entry.init({
    id_entry: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    entry_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    invoice_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 0),
      allowNull: false
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 0),
      allowNull: false
    }
    // ...outros campos como id_supplier, id_employee, etc.
  }, {
    sequelize,           // A instância de conexão é passada aqui pelo sequelize-manager
    modelName: 'Entry',  // O nome do modelo
    tableName: 'Entry',  // Nome exato da tabela no banco
    timestamps: false    // Se não houver colunas createdAt e updatedAt
  });
  
  return Entry;
};