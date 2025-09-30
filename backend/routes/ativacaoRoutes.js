// routes/ativacaoRoutes.js
const express = require('express');
const router = express.Router();
const ativacaoController = require('../controllers/ativacaoController');

router.get('/ativar-2fa', ativacaoController.showSetupPage);
router.post('/verificar-2fa', ativacaoController.verifyAndEnable);

module.exports = router;