// routes/itemRoutes.js (Versão Completa e Padronizada)

const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const stockEntryController = require('../controllers/stockEntryController');

// ======================================================
// --- ROTAS PARA ITENS (CRUD COMPLETO) ---
// ======================================================

// 1. READ (All) -> Listar todos os itens
// GET /itens
router.get('/itens', itemController.getAll);

// 2. CREATE (Show Form) -> Mostrar o formulário para criar um novo item
// GET /itens/novo
router.get('/itens/novo', itemController.showCreateForm);

// 3. CREATE (Process Form) -> Salvar o novo item no banco de dados
// POST /itens
router.post('/itens', itemController.create);

// 4. READ (One) & UPDATE (Show Form) -> Mostrar um item específico para editar
// GET /itens/:id/editar
router.get('/itens/:id/editar', itemController.showEditForm);
// 5. UPDATE (Process Form) -> Salvar as alterações de um item
// POST /itens/:id/atualizar  (Usamos POST pois formulários HTML simples não suportam PUT/PATCH)
router.post('/itens/:id/atualizar', itemController.update);

// 6. DELETE -> Deletar um item
// POST /itens/:id/deletar  (Usamos POST para simplificar a chamada a partir de um formulário/botão)
router.post('/itens/:id/deletar', itemController.destroy);


// ======================================================
// --- ROTAS PARA MOVIMENTAÇÃO DE ESTOQUE ---
// ======================================================

// Rota para EXIBIR o formulário de nova movimentação para um item
// GET /itens/:itemId/movimentacoes/adicionar
router.get('/itens/:itemId/movimentacoes/adicionar', stockEntryController.showEntryForm);

// Rota para CRIAR a nova movimentação
// POST /itens/:itemId/movimentacoes
router.post('/itens/:itemId/movimentacoes', stockEntryController.create);

// Rota para LISTAR todas as movimentações de um item (página de detalhes)
// GET /itens/:itemId/detalhes
router.get('/itens/:itemId/detalhes', stockEntryController.listByItem);


module.exports = router;