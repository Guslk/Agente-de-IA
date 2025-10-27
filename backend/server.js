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

// --- MÓDULOS PRINCIPAIS DA APLICAÇÃO ---
// Conexão com a base de dados mestre
const { connectMasterDB } = require('./config/database');

// Roteadores
const authRoutes = require('./routes/authRoutes');
const allTenantRoutes = require('./routes/allTenantRoutes');
const chapasRoutes = require('./routes/chapasRoutes'); // << 1. IMPORTAR A NOVA ROTA

// Middlewares
const tenantIdentifier = require('./middleware/tenantIdentifier');
const isAuthenticated = require('./middleware/authMiddleware');

// --- CONFIGURAÇÃO DA APLICAÇÃO ---
const app = express();
const PORT = process.env.PORT || 3000;

// Função principal assíncrona
const startServer = async () => {
  // 1. Conecta-se à base de dados mestre antes de iniciar o servidor
  await connectMasterDB();

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
  app.use(tenantIdentifier);
  app.use('/', authRoutes);
  
  // Rotas protegidas
  app.use(isAuthenticated.isAuthenticated);
  app.use('/', allTenantRoutes);
  app.use('/chapas', chapasRoutes); // << 2. USAR A NOVA ROTA (substitui /materiais)


  // --- GESTÃO DE ERROS CENTRALIZADA ---
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