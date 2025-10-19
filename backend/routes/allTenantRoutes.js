// ===================================================
// AGREGADOR DE ROTAS DO INQUILINO (routes/allTenantRoutes.js)
// Centraliza todas as rotas protegidas que são específicas de um inquilino.
// ===================================================
const express = require('express');
const router = express.Router();

// --- IMPORTAÇÃO DAS ROTAS PROTEGIDAS ---

const dashboardRoutes = require('./dashboardRoutes');
const stockRoutes = require('./stockRoutes');
const itemRoutes = require('./itemRoutes');
const toolRoutes = require('./toolRoutes');
const EmployeeRoutes = require('./employeeRoutes');
const toolHistoryRoutes = require('./toolHistoryRoutes');
// const fornecedorRoutes = require('./fornecedorRoutes');
const funcionarioRoutes = require('./funcionarioRoutes');
// const movimentacaoRoutes = require('./movimentacaoRoutes');
const relatorioRoutes = require('./relatorioRoutes');
const movementRoutes = require('./movementRoutes');
const supplierRoutes = require('./supplierRoutes')
// const batchRoutes = require('./inventoryRoutes');
const historicoRoutes = require('./historicoRoutes'); // Adicionado
const ativacaoRoutes = require('./ativacaoRoutes');
const manualRoutes = require('./manualRoutes');     // Adicionado


// ... (configuração do express, middlewares, etc.)

// MAIS ABAIXO, junto com os outros 'app.use()'
// router.use(inventoryRoutes);
// A rota base '/' é gerida pelo dashboard.
router.use(dashboardRoutes);
router.use(EmployeeRoutes);
router.use(toolHistoryRoutes);
router.use(toolRoutes);
router.use(supplierRoutes);
router.use(movementRoutes);
router.use(stockRoutes);
// Todas as rotas estão ativadas. Se o erro "argument handler must be a function"
// voltar a aparecer, significa que um dos ficheiros de rotas ou controladores
// importados acima contém um erro de exportação ou de sintaxe.
router.use(itemRoutes); 

// router.post('/batches', batchRoutes);
// router.use('/fornecedores', supplierRoutes);
router.use('/funcionarios', funcionarioRoutes);
// router.use('/movimentacoes', movimentacaoRoutes);
router.use('/relatorios', relatorioRoutes);
router.use('/historico', historicoRoutes); // Adicionado
router.use('/ativacao', ativacaoRoutes);
router.use('/manual', manualRoutes);     // Adicionado


// Rota de fallback: Se um utilizador autenticado aceder à raiz ('/'),
// redireciona-o para o dashboard para uma melhor experiência.
router.get('/', (req, res) => {
    res.redirect('/tools');
});

module.exports = router;

