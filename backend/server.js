
// ===================================================
// SERVIDOR PRINCIPAL (FICHEIRO DE ENTRADA) - ESTRUTURA CORRETA
// ===================================================
const express = require('express');
const path = require('path');
const session = require('express-session');
// const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

// --- MÓDULOS PRINCIPAIS DA APLICAÇÃO ---
// Conexão com a base de dados mestre
const { connectMasterDB } = require('./config/database');

// Middlewares
const tenantIdentifier = require('./middleware/tenantIdentifier');
const isAuthenticated = require('./middleware/authMiddleware');

// Roteadores
const authRoutes = require('./routes/authRoutes');
// CORREÇÃO: A linha abaixo estava a importar 'authRoutes' por engano.
const allTenantRoutes = require('./routes/allTenantRoutes');

// --- CONFIGURAÇÃO DA APLICAÇÃO ---
const app = express();
const PORT = process.env.PORT || 3000;

// Função principal assíncrona
const startServer = async () => {
  // 1. Conecta-se à base de dados mestre antes de iniciar o servidor
  await connectMasterDB();

//   // --- MIDDLEWARES DE SEGURANÇA (devem vir primeiro) ---
//   app.use(helmet());
//   const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutos
//     max: 150, // Aumentado ligeiramente o limite
//     standardHeaders: true,
//     legacyHeaders: false,
//   });
//   app.use(limiter);

  // --- MIDDLEWARES DE DESEMPENHO E UTILIDADE ---
  app.use(compression());
  app.use(morgan('dev')); // Logger de pedidos
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // --- CONFIGURAÇÃO DA SESSÃO ---
  app.use(session({
    secret: process.env.SESSION_SECRET || 'um-segredo-muito-fraco-para-desenvolvimento',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
  }));

  // --- LÓGICA DE ROTEAMENTO MULTI-TENANT ---

  // Passo 1: O middleware 'tenantIdentifier' é executado para TODOS os pedidos.
  // Ele identifica o subdomínio e anexa o 'tenantId' ao objeto 'req'.
  app.use(tenantIdentifier);

  // Passo 2: Rotas de autenticação (públicas).
  // Estas rotas não requerem que o utilizador esteja autenticado.
  // O 'tenantIdentifier' já foi executado, então estas rotas sabem a que base de dados se devem conectar.
  app.use('/', authRoutes);
  
  // Passo 3: Rotas principais da aplicação (protegidas).
  // Apenas utilizadores autenticados podem aceder a estas rotas.
  app.use('/', isAuthenticated, allTenantRoutes);


  // --- GESTÃO DE ERROS CENTRALIZADA (deve vir no final) ---
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo correu mal no servidor!');
  });

  // --- INICIA O SERVIDOR ---
  app.listen(PORT, () => {
    console.log(`🚀 Servidor a ser executado na porta ${PORT}`);
    console.log('Aguardando por pedidos nos subdomínios...');
  });
};

// Inicia a aplicação
startServer();

