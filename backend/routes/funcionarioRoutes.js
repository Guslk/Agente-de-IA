// routes/funcionarioRoutes.js

const express = require('express');
const router = express.Router();
const funcionarioController = require('../controllers/funcionarioController');

// Rota para listar (GET)
router.get('/', funcionarioController.getAllFuncionarios);

// Rota para criar (POST)
router.post('/novo', funcionarioController.createFuncionario);

// Rota para atualizar (POST)
router.post('/editar/:id', funcionarioController.updateFuncionario);

// Rota para excluir (POST)
router.post('/excluir/:id', funcionarioController.deleteFuncionario);

module.exports = router;