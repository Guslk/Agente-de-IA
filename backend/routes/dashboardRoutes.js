// routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();

// Importa o controlador do dashboard
const dashboardController = require('../controllers/dashboardController');

// Define que um pedido GET para '/dashboard' deve ser tratado
// pela função 'showDashboard' do controlador.
router.get('/dashboard', dashboardController.showDashboard);

// NOVAS ROTAS para as ações de retirar e devolver
router.post('/ferramentas/retirar/:id', dashboardController.retirarFerramenta);
router.post('/ferramentas/devolver/:id', dashboardController.devolverFerramenta);
router.post('/ferramentas/nova', dashboardController.createFerramenta);

module.exports = router;

