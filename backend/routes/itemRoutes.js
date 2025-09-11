// routes/itemRoutes.js

const express = require('express');
const router = express.Router();

// 1. Importa o Controller que cuidará da lógica desta rota
const itemController = require('../controllers/itemController');

// 2. Define a rota para a página principal de itens
// Quando alguém acessar a URL GET '/itens', a função getAllItems do controller será executada.
router.get('/', itemController.getAllItems);

// No futuro, você teria outras rotas aqui:
// router.get('/:id', itemController.getItemById);
// router.post('/novo', itemController.createItem);

module.exports = router;