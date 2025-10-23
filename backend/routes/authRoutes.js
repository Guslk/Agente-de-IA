// // // // routes/authRoutes.js

// // // const express = require('express');
// // // const router = express.Router();
// // // const authController = require('../controllers/authController');

// // // // Rota para EXIBIR a página de login (GET)
// // // router.get('/login', authController.showLoginPage);

// // // // Rota para PROCESSAR o formulário de login (POST)
// // // router.post('/login', authController.loginUser);

// // // router.get('/logout', authController.logoutUser);

// // // router.get('/login/verificar-2fa', authController.verifyLogin2FA);
// // // router.post('/login/verificar-2fa', authController.verifyLogin2FA);


// // // module.exports = router;
// // // routes/authRoutes.js
// // const express = require('express');
// // const router = express.Router();
// // const authController = require('../controllers/authController');

// // // Rota de Login
// // router.get('/login', authController.showLoginPage);
// // router.post('/login', authController.loginUser);

// // // Novas Rotas para Troca de Senha (Primeiro Acesso)
// // router.get('/change-password', authController.showChangePasswordPage);
// // router.post('/change-password', authController.postChangePassword);

// // // Rotas de 2FA
// // router.get('/verify-2fa', authController.show2FAPage);
// // router.post('/verify-2fa', authController.verify2FA);

// // // Rota de Logout
// // router.get('/logout', authController.logoutUser);

// // module.exports = router;

// // routes/authRoutes.js
// const express = require('express');
// const router = express.Router();
// const authController = require('../controllers/authController');

// // Rota de Login
// router.get('/login', authController.showLoginPage);
// router.post('/login', authController.loginUser);

// // Rota de Troca de Senha (Primeiro Acesso)
// router.get('/change-password', authController.showChangePasswordPage);
// router.post('/change-password', authController.postChangePassword);

// // Rota de Setup do 2FA (Primeiro Acesso)
// router.get('/setup-2fa', authController.showSetup2FAPage);
// router.post('/setup-2fa', authController.verify2FASetup);

// // Rota de Verificação 2FA (Logins Futuros)
// router.get('/verify-2fa', authController.show2FAPage);
// router.post('/verify-2fa', authController.verify2FA);

// // Rota de Logout
// router.get('/logout', authController.logoutUser);

// module.exports = router;


// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Rota de Login
router.get('/login', authController.showLoginPage);
router.post('/login', authController.loginUser);

// Rota de Troca de Senha (Primeiro Acesso)
router.get('/change-password', authController.showChangePasswordPage);
router.post('/change-password', authController.postChangePassword);

// Rota de Setup do 2FA (Primeiro Acesso)
router.get('/setup-2fa', authController.showSetup2FAPage);
router.post('/setup-2fa', authController.verify2FASetup);

// Rota de Verificação 2FA (Logins Futuros)
router.get('/verify-2fa', authController.show2FAPage);
router.post('/verify-2fa', authController.verify2FA); // <-- Garante que o nome bate

// Rota de Logout
router.get('/logout', authController.logoutUser);

module.exports = router;