

const express = require('express');
const router = express.Router();
const movimentacaoController = require('../controllers/movimentacaoController');


router.get('/', movimentacaoController.getAllMovimentacoes);

module.exports = router;