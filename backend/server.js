// server.js

// ===================================================
// 1. IMPORTAÇÕES
// ===================================================
const express = require('express');
const path = require('path');
const session = require('express-session');

// Importação dos Middlewares
const isAuthenticated = require('./middleware/authMiddleware');
const checkNotifications = require('./middleware/notificationMiddleware'); // << GARANTA QUE ESTA LINHA EXISTE

// Importação de todas as rotas
const dashboardRoutes = require('./routes/dashboardRoutes');
const itemRoutes = require('./routes/itemRoutes');
const movimentacaoRoutes = require('./routes/movimentacaoRoutes');
const fornecedorRoutes = require('./routes/fornecedorRoutes');
const funcionarioRoutes = require('./routes/funcionarioRoutes');
const relatorioRoutes = require('./routes/relatorioRoutes');
const authRoutes = require('./routes/authRoutes');
const manualRoutes = require('./routes/manualRoutes');
// ... e outras rotas que você tenha criado

// ===================================================
// 2. CONFIGURAÇÃO DO APP
// ===================================================
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar o EJS como o motor de templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares para processar dados de formulário
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração da Sessão
app.use(session({
    secret: 'seu-segredo-super-secreto',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 3600000 }
}));

// ===================================================
// 3. USO DAS ROTAS (ORDEM CORRETA)
// ===================================================

// PRIMEIRO: Rotas PÚBLICAS (não precisam de login)
app.use('/', authRoutes);

// SEGUNDO: A PARTIR DAQUI, TUDO É PROTEGIDO E TERÁ NOTIFICAÇÕES
app.use(isAuthenticated);
app.use(checkNotifications); // << GARANTA QUE ESTA LINHA EXISTE E ESTÁ AQUI

// TERCEIRO: Rotas PROTEGIDAS (agora exigem login e terão acesso à variável de notificação)
app.use('/', dashboardRoutes);
app.use('/itens', itemRoutes);
app.use('/movimentacoes', movimentacaoRoutes);
app.use('/fornecedores', fornecedorRoutes);
app.use('/funcionarios', funcionarioRoutes);
app.use('/relatorios', relatorioRoutes);
app.use('/manual', manualRoutes);
// ... e outras rotas protegidas

// ===================================================
// 4. INICIAR O SERVIDOR
// ===================================================
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});