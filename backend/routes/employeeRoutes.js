
// routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { isAuthenticated, isAdministrator } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configuração do Multer
// Usamos 'memoryStorage' para que o arquivo fique na memória (como um 'buffer')
// e possamos salvá-lo diretamente no banco de dados BLOB.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Protege todas as rotas de funcionários
router.use(isAuthenticated);

// Rota para LISTAR
router.get('/funcionarios', employeeController.getAll);

// Rotas de ADMINISTRADOR
// Adicionamos 'upload.single('photo')' como middleware.
// 'photo' deve ser o 'name' do seu <input type="file">.
router.post('/funcionarios', isAdministrator, upload.single('photo'), employeeController.create);
router.post('/funcionarios/:id/update', isAdministrator, upload.single('photo'), employeeController.update);
router.post('/funcionarios/:id/delete', isAdministrator, employeeController.destroy);

module.exports = router;