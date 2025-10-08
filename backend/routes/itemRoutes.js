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
router.post('/saida/:id', itemController.registrarSaida);

module.exports = router;

// routes/itemRoutes.js

// const express = require('express');
// const router = express.Router();
// const itemController = require('../controllers/itemController'); // Garanta que o caminho para o controller está correto

// /*
//  * ===================================================================
//  * ROTA PRINCIPAL PARA O CADASTRO DO ITEM
//  * ===================================================================
//  * * O formulário de "Adicionar Novo Item ao Estoque" enviará seus dados
//  * para esta rota usando o método POST.
//  * * O controller 'itemController.create' será o responsável por:
//  * 1. Iniciar uma transação no banco.
//  * 2. Criar o registro na tabela 'Items'.
//  * 3. Criar o registro na tabela 'StockEntries' usando o ID do novo item.
//  * 4. Confirmar a transação se tudo der certo.
//  */
// router.post('/', itemController.create); // <-- A rota que você precisa para o cadastro

// /*
//  * ===================================================================
//  * OUTRAS ROTAS PARA GERENCIAMENTO COMPLETO
//  * ===================================================================
//  */

// // Rota para exibir a página principal com a lista de todos os itens
// router.get('/', itemController.getAll);

// // Rota para atualizar um item existente (precisa do method-override)
// router.put('/:id', itemController.update);

// // Rota para deletar um item (precisa do method-override)
// router.delete('/:id', itemController.delete);

// // Rota para registrar uma nova saída de material
// router.post('/:id/saida', itemController.registrarSaida);

// module.exports = router;