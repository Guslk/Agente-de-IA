
const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { isAuthenticated } = require('../middleware/authMiddleware'); // Protege a rota

// Aplica a autenticação a todas as rotas de fornecedores
router.use(isAuthenticated);

// Rota para a página principal (lista todos os fornecedores)
router.get('/fornecedores', supplierController.getAll);

// Rota para CRIAR um novo fornecedor (do modal de cadastro)
router.post('/fornecedores', supplierController.create);

// Rota para ATUALIZAR um fornecedor (do modal de edição)
router.post('/fornecedores/:id/update', supplierController.update);

// Rota para DELETAR (soft delete) um fornecedor (do botão lixeira)
router.post('/fornecedores/:id/delete', supplierController.destroy);

// Rota para RESTAURAR um fornecedor da lixeira
router.post('/fornecedores/:id/restore', supplierController.restore);

module.exports = router;