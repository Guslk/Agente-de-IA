// models/index.js (Versão Final e Corrigida)
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);

const db = {};

// Carrega todas as definições de modelo do diretório atual
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const modelDefinition = require(path.join(__dirname, file));
    
    // =================================================================
    //                       CORREÇÃO APLICADA AQUI
    // =================================================================
    // Em vez de usar 'modelDefinition.name' (que é instável),
    // derivamos o nome do modelo a partir do NOME DO ARQUIVO.
    // Ex: "item.model.js" se torna "Item"
    const modelName = path.basename(file, '.js') // Remove a extensão .js
                        .replace('.model', '')  // Remove o sufixo .model, se houver
                        .replace(/^\w/, c => c.toUpperCase()); // Capitaliza a primeira letra
    // =================================================================

    db[modelName] = modelDefinition;
  });

// Função que será chamada pelo nosso middleware para inicializar os modelos
db.initialize = (sequelize) => {
    const initializedModels = {};

    // Inicializa cada modelo com a instância do Sequelize do inquilino
    Object.keys(db).forEach(modelName => {
        // Pula a própria função 'initialize' para evitar recursão infinita
        if (modelName === 'initialize') return;

        if (typeof db[modelName] === 'function') {
            const Model = db[modelName](sequelize, Sequelize.DataTypes);
            initializedModels[Model.name] = Model;
        }
    });

    // Cria as associações entre os modelos inicializados
    Object.keys(initializedModels).forEach(modelName => {
        if (initializedModels[modelName].associate) {
            initializedModels[modelName].associate(initializedModels);
        }
    });
    
    // Retorna os modelos prontos para uso
    return initializedModels;
};

module.exports = db;