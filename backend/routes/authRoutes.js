// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota para EXIBIR a página de login (GET)
router.get('/login', authController.showLoginPage);

// Rota para PROCESSAR o formulário de login (POST)
router.post('/login', authController.loginUser);

router.get('/logout', authController.logoutUser);


module.exports = router;