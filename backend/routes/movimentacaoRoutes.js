

const express = require('express');
const router = express.Router();
const movimentacaoController = require('../controllers/movimentacaoController');


router.get('/', movimentacaoController.getAllMovimentacoes);
router.post('/entrada', movimentacaoController.registrarEntrada);
router.post('/saida', movimentacaoController.registrarSaida);

module.exports = router;