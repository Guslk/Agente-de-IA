// routes/stockRoutes.js
const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

// Rota para CRIAR um novo estoque
router.post('/stocks', stockController.create);

// Rota para ATUALIZAR um estoque
router.post('/stocks/:id/update', stockController.update);

// Rota para DELETAR um estoque
router.post('/stocks/:id/delete', stockController.destroy);


module.exports = router;