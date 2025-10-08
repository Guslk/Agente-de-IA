// routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Rota para exibir o dashboard (existente)
router.get('/', dashboardController.showDashboard);

// NOVAS ROTAS para as ações de retirar e devolver
router.post('/ferramentas/retirar/:id', dashboardController.retirarFerramenta);
router.post('/ferramentas/devolver/:id', dashboardController.devolverFerramenta);
router.post('/ferramentas/nova', dashboardController.createFerramenta);

module.exports = router;