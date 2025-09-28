// routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();

// Importa o controlador do dashboard
const dashboardController = require('../controllers/dashboardController');

// Define que um pedido GET para '/dashboard' deve ser tratado
// pela função 'showDashboard' do controlador.
router.get('/dashboard', dashboardController.showDashboard);

// Exporta o router configurado para ser usado na aplicação principal.
module.exports = router;

