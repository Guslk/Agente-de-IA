// ===================================================
// AGREGADOR DE ROTAS DO INQUILINO (routes/allTenantRoutes.js)
// Centraliza todas as rotas protegidas que são específicas de um inquilino.
// ===================================================
const express = require('express');
const router = express.Router();

const stockRoutes = require('./stockRoutes');
const itemRoutes = require('./itemRoutes');
const toolRoutes = require('./toolRoutes');
const EmployeeRoutes = require('./employeeRoutes');
const toolHistoryRoutes = require('./toolHistoryRoutes');
const relatorioRoutes = require('./relatorioRoutes');
const movementRoutes = require('./movementRoutes');
const supplierRoutes = require('./supplierRoutes')
const manualRoutes = require('./manualRoutes');     // Adicionado
const resquestRoutes = require('./requestRoutes');     // Adicionado



router.use(stockRoutes);
router.use(resquestRoutes);
router.use(EmployeeRoutes);
router.use(toolHistoryRoutes);
router.use(toolRoutes);
router.use(supplierRoutes);
router.use(movementRoutes);
router.use(itemRoutes); 
router.use('/relatorios', relatorioRoutes);
router.use('/manual', manualRoutes);     // Adicionado


// Rota de fallback: Se um utilizador autenticado aceder à raiz ('/'),
// redireciona-o para o dashboard para uma melhor experiência.
router.get('/', (req, res) => {
    res.redirect('/tools');
});

module.exports = router;

