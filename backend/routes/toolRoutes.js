// routes/toolRoutes.js
const express = require('express');
const router = express.Router();
const toolController = require('../controllers/toolController');

// Rota para LISTAR todas as ferramentas (a página principal)
router.get('/tools', toolController.getAll);

// Rota para CRIAR uma nova ferramenta
router.post('/tools', toolController.create);

// // Rota para ATUALIZAR uma ferramenta
router.post('/tools/update/:id', toolController.update);
router.post('/tools/destroy/:id', toolController.destroy);

// // Rota para DELETAR uma ferramenta
// router.post('/tools/:id/delete', toolController.destroy);

router.post('/tools/withdraw/:id', toolController.withdraw);

// Rota para DEVOLVER (Return)
router.post('/tools/return/:id', toolController.return);

module.exports = router;