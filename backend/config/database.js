// ===================================================
// GERENCIADOR DE CONEXÃO HÍBRIDO (MongoDB Master -> MySQL Tenant)
// Arquivo: config/database.js
// ===================================================

// --- 1. IMPORTAÇÃO DE MÓDULOS ---
const mysql = require('mysql2/promise'); // Driver MySQL com suporte a Promises para as conexões dos inquilinos.
const mongoose = require('mongoose');   // ORM para interagir com o banco de dados mestre (MongoDB).
const fs = require('fs');               // Módulo File System do Node.js, usado para ler o arquivo de certificado SSL.
const Tenant = require('../models/tenant.model'); // Modelo Mongoose para consultar os dados dos inquilinos no DB mestre.
require('dotenv').config(); // Carrega as variáveis do arquivo .env


// Cache para armazenar os pools de conexão MySQL dos inquilinos
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


// --- 2. FUNÇÃO PARA OBTER A CONEXÃO DO BANCO DE DADOS DO INQUILINO (MYSQL) ---
const getTenantDB = async (tenantId) => {
  // Se já existir um pool para este inquilino no cache, retorna-o imediatamente.
  if (tenantPools.has(tenantId)) {
    console.log(`[DB] Reutilizando pool de conexões existente para o inquilino '${tenantId}'.`);
    return tenantPools.get(tenantId);
  }

  try {
    // Procura as informações do inquilino no banco de dados mestre (MongoDB)
    const tenant = await Tenant.findOne({ subdomain: tenantId, status: 'active' });

    if (!tenant) {
      throw new Error(`Inquilino '${tenantId}' não encontrado ou está inativo.`);
    }

    // -- NOVO BLOCO DE VERIFICAÇÃO --
    // Mostra o resultado completo da consulta ao MongoDB
    console.log(`[MONGO-QUERY] Documento completo do inquilino '${tenantId}' encontrado:`);


    console.log(`[INFO] Tentando criar pool de conexões MySQL...`);
    // Monta a configuração com as credenciais MySQL obtidas do objeto `database`.
    const tenantConfig = {
      host: tenant.database.host,
      port: tenant.database.port,
      user: tenant.database.db_user,
      password: tenant.database.db_password,
      database: tenant.database.db_name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };

    // Cria um novo pool de conexões MySQL
    const pool = mysql.createPool(tenantConfig);

    // Testa a conexão para garantir que as credenciais estão corretas
    const connection = await pool.getConnection();
    connection.release();

    // Armazena o novo pool no cache
    tenantPools.set(tenantId, pool);

    console.log(`✅ Pool de conexões MySQL criado com sucesso para o inquilino '${tenantId}'.`);
    return pool;

  } catch (error) {
    console.error(`❌ Falha crítica ao obter a conexão do banco de dados para o inquilino '${tenantId}'.`);
    // Usando as credenciais do 'tenant' se o erro ocorrer após a busca
    if (error.config) {
      const { host, database, user } = error.config;
      console.error(`[DEBUG] Configuração utilizada (parcial):`, { host, database, user });
    }
    console.error(`[DEBUG] Mensagem de erro do MySQL:`, error.message);
    throw error;
  }
};

// --- 3. EXPORTAÇÃO DOS MÓDULOS ---
module.exports = { connectMasterDB, getTenantDB };

