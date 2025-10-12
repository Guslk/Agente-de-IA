// routes/departamentoRoutes.js
const express = require('express');
const router = express.Router();
const departamentoController = require('../controllers/departamentoController');

// Rota para criar um novo departamento
router.post('/novo', departamentoController.create);

module.exports = router;