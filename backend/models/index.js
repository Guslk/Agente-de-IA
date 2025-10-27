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


// 'use strict';

// const fs = require('fs');
// const path = require('path');
// const Sequelize = require('sequelize');
// const { getTenantDB } = require('../config/database'); // Importa a função para obter a conexão do tenant
// const basename = path.basename(__filename);

// const modelDefiners = {}; // Armazena as funções que definem os modelos
// const modelsCache = new Map(); // Cache para guardar os modelos já inicializados por tenant

// // Carrega todas as FUNÇÕES que definem os modelos do diretório atual
// fs
//   .readdirSync(__dirname)
//   .filter(file => {
//     return (
//       file.indexOf('.') !== 0 &&
//       file !== basename &&
//       file.slice(-3) === '.js' &&
//       file.indexOf('.test.js') === -1 &&
//       file !== 'tenant.model.js' // Exclui o modelo do MongoDB
//     );
//   })
//   .forEach(file => {
//     // Importa a FUNÇÃO que define o modelo (ex: module.exports = (sequelize, DataTypes) => { ... })
//     try {
//       const modelDefiner = require(path.join(__dirname, file));
      
//       // Garante que o que foi importado é uma função
//       if (typeof modelDefiner === 'function') {
//         const modelName = file.split('.')[0].replace(/^\w/, c => c.toUpperCase());
//         modelDefiners[modelName] = modelDefiner;
//         console.log(`[Model Loader] Definição do modelo '${modelName}' carregada.`);
//       } else {
//         console.warn(`[Model Loader] Arquivo '${file}' não exporta uma função de definição Sequelize, pulando.`);
//       }
//     } catch (error) {
//       console.error(`[Model Loader] Erro ao carregar o modelo '${file}': ${error.message}`);
//     }
//   });

// /**
//  * Função principal exportada: Obtém os modelos para um tenant específico
//  * @param {string} tenantId - O ID (subdomínio) do tenant.
//  * @returns {Promise<object>} - Um objeto contendo os modelos inicializados (Plate, Cut, etc.) e a instância do sequelize.
//  */
// const getModels = async (tenantId) => {
//     // 1. Verifica o cache
//     if (modelsCache.has(tenantId)) {
//         // Retorna a promessa do cache se ela ainda estiver pendente, ou os modelos resolvidos
//         return modelsCache.get(tenantId);
//     }

//     console.log(`[getModels] Obtendo conexão Sequelize para o tenant '${tenantId}'...`);
    
//     // Cria uma "promessa" que será resolvida com os models
//     // e armazena essa promessa no cache.
//     // Isso evita que múltiplas requisições simultâneas tentem criar a conexão.
//     const modelsPromise = new Promise(async (resolve, reject) => {
//       try {
//         // 2. Obtém a conexão Sequelize específica do tenant
//         const sequelize = await getTenantDB(tenantId); 
        
//         const initializedModels = {};

//         // 3. Define cada modelo usando a conexão obtida
//         console.log(`[getModels] Definindo modelos para o tenant '${tenantId}'...`);
//         Object.keys(modelDefiners).forEach(modelName => {
//             const Model = modelDefiners[modelName](sequelize, Sequelize.DataTypes);
//             initializedModels[Model.name] = Model; // Usa Model.name (ex: 'Plate')
//         });

//         // 4. Cria as associações entre os modelos
//         console.log(`[getModels] Criando associações para o tenant '${tenantId}'...`);
//         Object.keys(initializedModels).forEach(modelName => {
//             if (initializedModels[modelName].associate) {
//                 initializedModels[modelName].associate(initializedModels);
//             }
//         });
        
//         initializedModels.sequelize = sequelize; // Adiciona a instância sequelize

//         console.log(`[getModels] Modelos para o tenant '${tenantId}' inicializados com sucesso.`);
        
//         // 5. Resolve a promessa com os modelos prontos
//         resolve(initializedModels);

//       } catch (error) {
//         console.error(`Erro ao obter models para o tenant ${tenantId}:`, error);
//         // Se falhar, remove a promessa falha do cache para tentar de novo na próxima vez
//         modelsCache.delete(tenantId);
//         reject(new Error(`Não foi possível carregar os modelos do banco de dados para o tenant ${tenantId}.`));
//       }
//     });

//     // Armazena a promessa no cache
//     modelsCache.set(tenantId, modelsPromise);

//     // 6. Retorna a promessa (que será resolvida com os modelos)
//     return modelsPromise;
// };

// // Esta é a única exportação do arquivo.
// module.exports = getModels;
