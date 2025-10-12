// ===================================================
// AGREGADOR DE ROTAS DO INQUILINO (routes/allTenantRoutes.js)
// Centraliza todas as rotas protegidas que são específicas de um inquilino.
// ===================================================
const express = require('express');
const router = express.Router();

// --- IMPORTAÇÃO DAS ROTAS PROTEGIDAS ---
const dashboardRoutes = require('./dashboardRoutes');

const itemRoutes = require('./itemRoutes');
const fornecedorRoutes = require('./fornecedorRoutes');
const funcionarioRoutes = require('./funcionarioRoutes');
const movimentacaoRoutes = require('./movimentacaoRoutes');
const relatorioRoutes = require('./relatorioRoutes');
const historicoRoutes = require('./historicoRoutes'); // Adicionado
const ativacaoRoutes = require('./ativacaoRoutes');
const manualRoutes = require('./manualRoutes');     // Adicionado

// --- REGISTO DAS ROTAS COM PREFIXOS ---

// A rota base '/' é gerida pelo dashboard.
router.use('/', dashboardRoutes);

// Todas as rotas estão ativadas. Se o erro "argument handler must be a function"
// voltar a aparecer, significa que um dos ficheiros de rotas ou controladores
// importados acima contém um erro de exportação ou de sintaxe.
router.use(itemRoutes); 
// router.use('/itens', itemRoutes);
router.use('/fornecedores', fornecedorRoutes);
router.use('/funcionarios', funcionarioRoutes);
router.use('/movimentacoes', movimentacaoRoutes);
router.use('/relatorios', relatorioRoutes);
router.use('/historico', historicoRoutes); // Adicionado
router.use('/ativacao', ativacaoRoutes);
router.use('/manual', manualRoutes);     // Adicionado


// Rota de fallback: Se um utilizador autenticado aceder à raiz ('/'),
// redireciona-o para o dashboard para uma melhor experiência.
router.get('/', (req, res) => {
    res.redirect('/dashboard');
});

module.exports = router;

