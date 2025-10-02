const mongoose = require('mongoose');
const path = require('path');
const Tenant = require('../models/tenant.model'); // Importa o modelo que criamos

// Carrega as variáveis de ambiente da raiz do projeto
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const MONGO_URI = process.env.MASTER_MONGO_URI;

// Array com os dados dos clientes que você quer inserir
const tenantsToSeed = [
  {
    name: '***',
    subdomain: '****',
    database: { 
      host: '****',
      port: 1111,
      db_name: '**',
      db_user: '***',
      db_password: '**',
    },
  },
];

const seedDB = async () => {
  if (!MONGO_URI) {
    console.error("URI do MongoDB Master não encontrada. Verifique seu arquivo .env");
    return;
  }

  try {
    // 1. Conectar ao banco de dados master
    await mongoose.connect(MONGO_URI);
    console.log("Conectado ao MongoDB Master para o seeding...");

    // 2. Limpar a coleção antes de inserir (opcional, bom para testes)
    console.log("Pulando a limpeza da coleção 'tenants'...");
    // await Tenant.deleteMany({}); // Esta linha não irá apagar mais os dados

    // 3. Inserir os novos dados
    console.log("Inserindo novos dados de inquilinos...");
    await Tenant.insertMany(tenantsToSeed);

    console.log("✅ Banco de dados populado com sucesso!");

  } catch (error) {
    console.error("❌ Erro ao popular o banco de dados:", error);
  } finally {
    // 4. Fechar a conexão, independentemente do resultado
    console.log("Fechando a conexão com o MongoDB...");
    mongoose.connection.close();
  }
};

// Executa a função
seedDB();

