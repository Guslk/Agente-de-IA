// models/Plate.js
'use strict';
const { Model } = require('sequelize');

// Exportamos uma função que será chamada pelo models/index.js
module.exports = (sequelize, DataTypes) => {
  class Plate extends Model {
    /**
     * Define as associações (relações) aqui.
     * O models/index.js chamará esta função.
     */
    static associate(models) {
      // Uma Chapa (Plate) tem muitos Cortes (Cut)
      Plate.hasMany(models.Cut, {
        foreignKey: 'plate_id',
        as: 'cuts' // Damos um apelido para a relação
      });
    }
  }
  
  // Inicializa o modelo com as colunas da sua tabela MySQL
  Plate.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    original_width_mm: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    original_height_mm: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2), // Ex: 1250.50
      allowNull: true,
      defaultValue: 0.00
    }
    
  }, {
    sequelize,
    modelName: 'Plate',  // Nome do modelo em JavaScript
    tableName: 'plates', // Nome exato da tabela no seu MySQL
    timestamps: false    // Desativa colunas createdAt e updatedAt
  });
  
  return Plate;
};