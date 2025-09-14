const mongoose = require('mongoose');

// 1. Definir o Schema (a estrutura do documento)
// Este schema garante que todos os documentos na coleção 'tenants'
// terão estes campos e tipos de dados.
const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'O nome do inquilino é obrigatório.'],
    trim: true,
  },
  subdomain: {
    type: String,
    required: [true, 'O subdomínio é obrigatório.'],
    unique: true, // Garante que não haja dois inquilinos com o mesmo subdomínio
    lowercase: true,
    trim: true,
    index: true, // Cria um índice neste campo para buscas rápidas
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'], // Só permite estes valores
    default: 'active',
  },
  // Objeto para armazenar as credenciais do banco de dados MySQL do inquilino
  database: {
    driver: {
      type: String,
      default: 'mysql',
    },
    host: {
      type: String,
      required: true,
    },
    port: {
      type: Number,
      default: 3306,
    },
    db_name: {
      type: String,
      required: true,
    },
    db_user: {
      type: String,
      required: true,
    },
    db_password: {
      type: String,
      required: true,
    },
  },
  // Timestamps automáticos para controle
}, { timestamps: true });

// 2. Criar e Exportar o Modelo
// O Mongoose pegará o nome 'Tenant', o colocará em minúsculo e no plural ('tenants')
// para nomear a coleção no MongoDB.
const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant;
