// routes/funcionarioRoutes.js

const express = require('express');
const router = express.Router();
const funcionarioController = require('../controllers/funcionarioController');

// Define a rota principal para a listagem de funcionários
router.get('/', funcionarioController.getAllFuncionarios);

module.exports = router;