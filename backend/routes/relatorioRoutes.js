// routes/relatorioRoutes.js

const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');

// Define a rota para GET /relatorios
router.get('/', relatorioController.showRelatorios);

module.exports = router;