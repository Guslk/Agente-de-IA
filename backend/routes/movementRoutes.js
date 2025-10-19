// routes/movementRoutes.js
const express = require('express');
const router = express.Router();
const movementController = require('../controllers/movementController');

router.get('/movimentacoes', movementController.getAll);
router.post('/entries', movementController.createEntry);
router.post('/outputs', movementController.createOutput);

module.exports = router;