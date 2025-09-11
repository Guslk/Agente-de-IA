// routes/movimentacaoRoutes.js

const express = require('express');
const router = express.Router();
const movimentacaoController = require('../controllers/movimentacaoController');

// Define a rota para GET /movimentacoes
router.get('/', movimentacaoController.getAllMovimentacoes);

module.exports = router;