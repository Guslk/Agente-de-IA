// 'use strict';

// const fs = require('fs');
// const path = require('path');
// const Sequelize = require('sequelize');
// const basename = path.basename(__filename);
// const env = process.env.NODE_ENV || 'development';
// const config = require(__dirname + '/../config/config.json')[env]; // <-- Atenção a este caminho
// const db = {};

// // 1. INICIALIZA A CONEXÃO COM O BANCO DE DADOS
// let sequelize;
// if (config.use_env_variable) {
//   sequelize = new Sequelize(process.env[config.use_env_variable], config);
// } else {
//   sequelize = new Sequelize(config.database, config.username, config.password, config);
// }

// // 2. CARREGA TODOS OS ARQUIVOS DE MODELO DA PASTA ATUAL
// fs
//   .readdirSync(__dirname)
//   .filter(file => {
//     return (
//       file.indexOf('.') !== 0 &&
//       file !== basename &&
//       file.slice(-3) === '.js'
//     );
//   })
//   .forEach(file => {
//     // Para cada arquivo, importa o modelo e o adiciona ao objeto 'db'
//     const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
//     db[model.name] = model;
//   });

// // 3. EXECUTA AS ASSOCIAÇÕES (A MÁGICA ACONTECE AQUI!)
// // Percorre todos os modelos carregados no objeto 'db'
// Object.keys(db).forEach(modelName => {
//   // Se o modelo tiver um método 'associate'
//   if (db[modelName].associate) {
//     // Executa esse método para criar as relações
//     db[modelName].associate(db);
//   }
// });

// // 4. EXPORTA TUDO O QUE É NECESSÁRIO PARA A APLICAÇÃO
// db.sequelize = sequelize; // A instância da conexão
// db.Sequelize = Sequelize; // A própria classe Sequelize

// module.exports = db;