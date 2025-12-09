'use strict';
// A importação deve estar aqui, e APENAS aqui.
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Cut extends Model {
    /**
     * Define as associações (relações) aqui.
     * O models/index.js chamará esta função.
     */
    static associate(models) {
      // Um Corte (Cut) pertence a uma Chapa (Plate)
      Cut.belongsTo(models.Plate, {
        foreignKey: 'plate_id',
        as: 'plate'
      });
    }
  }
  
  // Inicializa o modelo com as colunas da sua tabela MySQL
  Cut.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    plate_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'plates', // Nome da tabela que ele referencia
        key: 'id'
      }
    },
    coordinates: {
      type: DataTypes.JSON, // O tipo JSON é ideal para armazenar os arrays/objetos de coordenadas
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Cut',
    tableName: 'cuts',
    timestamps: false
  });
  
  return Cut;
};
