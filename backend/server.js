// server.js

// ===================================================
// 1. IMPORTAÇÕES
// ===================================================
const express = require('express');
const path = require('path');
const session = require('express-session');

// Importação do Middleware
const isAuthenticated = require('./middleware/authMiddleware');

// Importação de todas as rotas
const dashboardRoutes = require('./routes/dashboardRoutes');
const itemRoutes = require('./routes/itemRoutes');
const movimentacaoRoutes = require('./routes/movimentacaoRoutes');
const fornecedorRoutes = require('./routes/fornecedorRoutes');
const funcionarioRoutes = require('./routes/funcionarioRoutes');
const relatorioRoutes = require('./routes/relatorioRoutes');
const authRoutes = require('./routes/authRoutes');

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


app.use('/', authRoutes);


app.use(isAuthenticated);


app.use('/', dashboardRoutes);
app.use('/itens', itemRoutes);
app.use('/movimentacoes', movimentacaoRoutes);
app.use('/fornecedores', fornecedorRoutes);
app.use('/funcionarios', funcionarioRoutes);
app.use('/relatorios', relatorioRoutes);


app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});