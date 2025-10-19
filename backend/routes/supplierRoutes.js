// routes/supplierRoutes.js
const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

// 1. Rota para LER TUDO / INDEX (A rota que o res.redirect busca após o cadastro)
// CORRIGIDO: O nome da sua rota GET deve ser simples para o redirecionamento funcionar.
router.get('/fornecedores', supplierController.getAll);

// 2. Rota para CRIAR
// Manter a rota POST que o seu formulário está usando
router.post('/fornecedores/novo', supplierController.create); 

// 3. Rota para ATUALIZAR
router.post('/fornecedores/editar/:id', supplierController.update);

// 4. Rota para DELETAR
router.post('/fornecedores/excluir/:id', supplierController.destroy);


module.exports = router;