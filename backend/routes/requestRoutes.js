// // // routes/requestRoutes.js
// // const express = require('express');
// // const router = express.Router();
// // const requestController = require('../controllers/requestController');
// // const { isAuthenticated, isAdministrator } = require('../middleware/authMiddleware');

// // router.use(isAuthenticated);

// // // Rota para MOSTRAR A LISTA de requisições
// // router.get('/requisicoes', requestController.getAll);

// // // Rota para MOSTRAR A PÁGINA "CARRINHO"
// // router.get('/requisicoes/nova', requestController.showCreateForm);

// // // Rota para CRIAR (Reservar)
// // router.post('/requisicoes', requestController.create);

// // // Rota para APROVAR (Dar Baixa) - Apenas Admins
// // router.post('/requisicoes/:id/approve', isAdministrator, requestController.approve);

// // // Rota para CANCELAR (Retorno Total)
// // router.post('/requisicoes/:id/cancel', requestController.cancel);

// // // Rota para RETORNO PARCIAL
// // // router.post('/requisicoes/return-item', requestController.returnPartial);

// // router.get('/devolucao/:id', requestController.showReturnForm);
// // router.post('/:id/devolver', requestController.processReturn);
// // router.post('/:id/devolver-tudo', requestController.returnComplete);

// // module.exports = router;

// // routes/requestRoutes.js
// const express = require('express');
// const router = express.Router();
// const requestController = require('../controllers/requestController');
// const { isAuthenticated, isAdministrator } = require('../middleware/authMiddleware');

// router.use(isAuthenticated);

// // Rota para MOSTRAR A LISTA de requisições
// router.get('/requisicoes', requestController.getAll);

// // Rota para MOSTRAR A PÁGINA "CARRINHO"
// router.get('/requisicoes/nova', requestController.showCreateForm);

// // Rota para CRIAR (Reservar)
// router.post('/requisicoes', requestController.create);

// // Rota para APROVAR (Dar Baixa) - Apenas Admins
// router.post('/requisicoes/:id/approve', isAdministrator, requestController.approve);

// // Rota para CANCELAR (Retorno Total)
// router.post('/requisicoes/:id/cancel', requestController.cancel);

// // === ROTAS DE DEVOLUÇÃO CORRIGIDAS ===

// // Rota para MOSTRAR FORMULÁRIO DE DEVOLUÇÃO
// router.get('/requisicoes/devolucao/:id', requestController.showReturnForm);

// // Rota para PROCESSAR DEVOLUÇÃO PARCIAL
// router.post('/requisicoes/:id/devolver', requestController.processReturn);

// // Rota para DEVOLUÇÃO COMPLETA
// router.post('/requisicoes/:id/devolver-tudo', requestController.returnComplete);

// // Rota para RETORNO PARCIAL (manter se ainda for usada)
// // router.post('/requisicoes/return-item', requestController.returnPartial);

// module.exports = router;

// routes/requestRoutes.js
const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { isAuthenticated, isAdministrator } = require('../middleware/authMiddleware');

router.use(isAuthenticated);

// ⚠️ ORDEM CRÍTICA: POST antes de GET
router.post('/requisicoes/:id/devolver', requestController.processReturn);
router.post('/requisicoes/:id/devolver-tudo', requestController.returnComplete);

// Rotas principais
router.get('/requisicoes', requestController.getAll);
router.get('/requisicoes/nova', requestController.showCreateForm);
router.get('/requisicoes/devolucao/:id', requestController.showReturnForm);

router.get('/api/search-items', requestController.searchItems);

// Outras rotas POST
router.post('/requisicoes', requestController.create);
router.post('/requisicoes/:id/approve', isAdministrator, requestController.approve);
router.post('/requisicoes/:id/cancel', requestController.cancel);

module.exports = router;