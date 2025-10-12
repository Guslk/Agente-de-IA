const express = require('express');
const router = express.Router();
const materiaPrimaController = require('../controllers/materiaPrimaController');

router.get('/', materiaPrimaController.listar);
router.post('/novo', materiaPrimaController.create);
router.post('/consumir/:id', materiaPrimaController.consumir);

module.exports = router;