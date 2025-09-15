const mongoose = require('mongoose');
require('dotenv').config(); // Carrega as variáveis do arquivo .env

const MONGO_URI = process.env.MASTER_MONGO_URI;

// Função assíncrona para conectar ao banco de dados
const connectMasterDB = async () => {
  try {
    // Validação para garantir que a URI foi carregada
    if (!MONGO_URI) {
      throw new Error("A URI do MongoDB Master não foi definida no arquivo .env");
    }

    // Tenta conectar ao MongoDB usando Mongoose
    await mongoose.connect(MONGO_URI);

    console.log('✅ Conexão com o Banco de Dados Master (MongoDB) estabelecida com sucesso!');

  } catch (error) {
    // Se ocorrer um erro, exibe o erro e encerra a aplicação
    console.error('❌ Erro ao conectar ao Banco de Dados Master:', error.message);
    
    process.exit(1); 
  }
};

connectMasterDB();
module.exports = connectMasterDB;
