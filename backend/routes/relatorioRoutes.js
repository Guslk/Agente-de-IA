// routes/relatorioRoutes.js
const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware'); // Protege a rota

// GET /relatorios - Mostra a página principal de relatórios
// Protegido para que apenas usuários logados (e talvez admins) possam ver
router.get('/', isAuthenticated, relatorioController.showRelatorios);

module.exports = router;