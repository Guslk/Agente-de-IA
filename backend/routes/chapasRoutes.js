// routes/chapasRoutes.js

const express = require('express');
const router = express.Router();
const chapasController = require('../controllers/chapasController');

// ===================================================
// == ROTA PARA A PÁGINA (Acessada pelo navegador)  ==
// ===================================================
// GET /chapas
// Renderiza a página principal de controle de chapas e barras.
router.get('/', chapasController.renderPage);

// ===================================================
// == ROTAS DA API (CHAPAS)                         ==
// ===================================================

// GET /chapas/api/plates
// Lista todas as chapas cadastradas.
router.get('/api/plates', chapasController.listPlates);

// POST /chapas/api/plates
// Cria uma nova chapa no banco de dados.
router.post('/api/plates', chapasController.createPlate);

// GET /chapas/api/plates/:id/cuts
// Busca todos os cortes salvos para uma chapa específica.
router.get('/api/plates/:id/cuts', chapasController.getCuts);

// POST /chapas/api/plates/:id/cuts
// Deleta os cortes antigos e salva os novos cortes para uma chapa.
router.post('/api/plates/:id/cuts', chapasController.saveCuts);

// ===================================================
// == NOVAS ROTAS DA API (BARRAS)                   ==
// ===================================================

// GET /chapas/api/bars
// Lista todas as barras disponíveis (comprimento restante > 0).
router.get('/api/bars', chapasController.listBars);

// GET /chapas/api/bars/:id/history
// Busca o histórico de consumo de uma barra específica.
router.get('/api/bars/:id/history', chapasController.getBarHistory);

// POST /chapas/api/bars/consume
// Registra um novo consumo (corte) em uma barra.
router.post('/api/bars/consume', chapasController.consumeBar);


module.exports = router;