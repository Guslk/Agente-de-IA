// routes/fornecedorRoutes.js

const express = require('express');
const router = express.Router();
const fornecedorController = require('../controllers/fornecedorController');


router.get('/', fornecedorController.getAllFornecedores);

module.exports = router;