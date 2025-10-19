// // routes/inventoryRoutes.js

// const express = require('express');
// const router = express.Router();
// const batchController = require('../controllers/batchController'); // Garanta que o nome do controller está correto

// // Rota para processar o formulário de nova entrada de estoque (lote)
// router.post('/batches', batchController.create);

// router.get('/api/items/:itemId/batches', batchController.getBatchesByItem);
// // Você pode ter outras rotas aqui também
// // router.get('/batches', batchController.getAll);

// module.exports = router;

// routes/inventoryRoutes.js (ou similar)

const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController'); // Garanta que este controller está importado
const movementController = require('../controllers/movementController');


// Rota para processar o formulário de nova entrada de estoque
// router.post('/batches', batchController.create);
// router.post('/exits', movementController.createExit);
// ======================================================
//             NOVA ROTA DA API ADICIONADA AQUI 👇
// ======================================================
// Rota que retorna JSON com todos os lotes de um item específico
// router.get('/api/items/:itemId/batches', batchController.getBatchesByItem);
// ======================================================

module.exports = router;