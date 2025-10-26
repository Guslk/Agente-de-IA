
// ===================================================
// GERENCIADOR DE CONEXÃO HÍBRIDO (MongoDB Master -> MySQL Tenant com Sequelize)
// Arquivo: config/database.js
// ===================================================

// --- 1. IMPORTAÇÃO DE MÓDULOS ---
const { Sequelize } = require('sequelize'); // ORM para interagir com os bancos de dados dos inquilinos (MySQL).
const mongoose = require('mongoose');      // ORM para interagir com o banco de dados mestre (MongoDB).
const fs = require('fs');                  // Módulo File System do Node.js (mantido caso precise para SSL no futuro).
const Tenant = require('../models/tenant.model'); // Modelo Mongoose para consultar os dados dos inquilinos no DB mestre.
require('dotenv').config(); // Carrega as variáveis do arquivo .env


// Cache para armazenar as instâncias do Sequelize para cada inquilino.
const tenantPools = new Map();

// --- 1. CONEXÃO COM O BANCO DE DADOS MESTRE (MONGODB) ---
const connectMasterDB = async () => {
  try {
    const MONGO_URI = process.env.MASTER_MONGO_URI;
    if (!MONGO_URI) {
      throw new Error("A URI do MongoDB Master (MASTER_MONGO_URI) não foi definida no arquivo .env");
    }
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conexão com o Banco de Dados Mestre (MongoDB) estabelecida com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar ao Banco de Dados Mestre:', error.message);
    process.exit(1);
  }
};


// --- 2. FUNÇÃO PARA OBTER A INSTÂNCIA DO SEQUELIZE PARA O INQUILINO (MYSQL) ---
const getTenantDB = async (tenantId) => {
  // Se já existir uma instância do Sequelize para este inquilino no cache, retorna-a imediatamente.
  if (tenantPools.has(tenantId)) {
    console.log(`[DB] Reutilizando instância do Sequelize existente para o inquilino '${tenantId}'.`);
    return tenantPools.get(tenantId);
  }

  try {
    // Procura as informações do inquilino no banco de dados mestre (MongoDB)
    const tenant = await Tenant.findOne({ subdomain: tenantId, status: 'active' });

    if (!tenant) {
      throw new Error(`Inquilino '${tenantId}' não encontrado ou está inativo.`);
    }

    console.log(`[INFO] Tentando criar instância do Sequelize para o inquilino '${tenantId}'...`);
    
    // Monta a configuração do Sequelize com as credenciais obtidas.
    const sequelizeConfig = {
      timezone: 'America/Sao_Paulo',
      dialect: 'mysql', // Especifica o dialeto do banco de dados
      host: tenant.database.host,
      port: tenant.database.port,
      database: tenant.database.db_name,
      username: tenant.database.db_user, // Sequelize usa 'username' em vez de 'user'
      password: tenant.database.db_password,
      pool: { // Configurações do pool de conexões gerenciado pelo Sequelize
        max: 10, // Equivalente ao connectionLimit
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      logging: false, // Desative para não poluir o console com logs de query SQL. Mude para console.log para debugar.
    };

    // Cria uma nova instância do Sequelize
    const sequelize = new Sequelize(sequelizeConfig);

    // Testa a conexão para garantir que as credenciais estão corretas
    await sequelize.authenticate();

    // Armazena a nova instância no cache
    tenantPools.set(tenantId, sequelize);

    console.log(`✅ Instância do Sequelize criada e conectada com sucesso para o inquilino '${tenantId}'.`);
    return sequelize;

  } catch (error) {
    console.error(`❌ Falha crítica ao obter a conexão do banco de dados para o inquilino '${tenantId}'.`);
    // O erro do Sequelize já costuma ser bem descritivo
    console.error(`[DEBUG] Mensagem de erro do Sequelize:`, error.message);
    throw error;
  }
};

// --- 3. EXPORTAÇÃO DOS MÓDULOS ---
module.exports = { connectMasterDB, getTenantDB };