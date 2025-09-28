// ===================================================
// AGREGADOR DE ROTAS DO INQUILINO (routes/allTenantRoutes.js)
// Centraliza todas as rotas protegidas que são específicas de um inquilino.
// ===================================================
const express = require('express');
const router = express.Router();

// --- IMPORTAÇÃO DAS ROTAS PROTEGIDAS ---
// Este bloco estava em falta no seu ficheiro local.
const dashboardRoutes = require('./dashboardRoutes');
const itemRoutes = require('./itemRoutes');
const fornecedorRoutes = require('./fornecedorRoutes');
const funcionarioRoutes = require('./funcionarioRoutes');
const movimentacaoRoutes = require('./movimentacaoRoutes');
const relatorioRoutes = require('./relatorioRoutes');

// --- REGISTO DAS ROTAS COM PREFIXOS ---

// A rota base '/' é gerida pelo dashboard ou redireciona para ele.
router.use('/', dashboardRoutes);

// Todas as rotas em 'itemRoutes' serão acedidas com o prefixo '/itens'.
// Exemplo: GET /itens/
router.use('/itens', itemRoutes);

// Exemplo: GET /fornecedores/
router.use('/fornecedores', fornecedorRoutes);

// Exemplo: GET /funcionarios/
router.use('/funcionarios', funcionarioRoutes);

// Exemplo: GET /movimentacoes/
router.use('/movimentacoes', movimentacaoRoutes);

// Exemplo: GET /relatorios/
router.use('/relatorios', relatorioRoutes);

// Rota de fallback: Se um utilizador autenticado aceder à raiz ('/'),
// redireciona-o para o dashboard para uma melhor experiência.
router.get('/', (req, res) => {
    res.redirect('/dashboard');
});

module.exports = router;

