// routes/toolHistoryRoutes.js
const express = require('express');
const router = express.Router();
const toolHistoryController = require('../controllers/toolHistoryController');

// Rota para a página de histórico de ferramentas
router.get('/tool-history', toolHistoryController.getAll);

module.exports = router;