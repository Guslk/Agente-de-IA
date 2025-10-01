// routes/ativacaoRoutes.js

console.log(">>> O arquivo ativacaoRoutes.js foi carregado com sucesso!"); // Linha de debug

const express = require('express');
const router = express.Router();
const ativacaoController = require('../controllers/ativacaoController');

// Garante que a rota GET para '/ativar-2fa' está definida corretamente
router.get('/ativar-2fa', ativacaoController.showSetupPage);

// Rota para o passo seguinte de verificação
router.post('/verificar-2fa', ativacaoController.verifyAndEnable);
router.get('/sucesso', ativacaoController.showSuccessPage);

module.exports = router;