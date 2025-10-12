// routes/fornecedorRoutes.js

const express = require('express');
const router = express.Router();
const fornecedorController = require('../controllers/fornecedorController');

// Rota para listar todos os fornecedores (GET)
router.get('/', fornecedorController.getAllFornecedores);

// Rota para criar um novo fornecedor (POST)
router.post('/novo', fornecedorController.createFornecedor);

// Rota para atualizar um fornecedor (POST)
router.post('/editar/:id', fornecedorController.updateFornecedor);

// Rota para excluir um fornecedor (POST)
router.post('/excluir/:id', fornecedorController.deleteFornecedor);

module.exports = router;