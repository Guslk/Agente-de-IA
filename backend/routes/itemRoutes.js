// routes/itemRoutes.js

const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// Rotas existentes
router.get('/', itemController.getAllItems);
router.post('/novo', itemController.createItem);

// NOVAS ROTAS para editar e excluir
router.post('/editar/:id', itemController.updateItem);
router.post('/excluir/:id', itemController.deleteItem);


module.exports = router;