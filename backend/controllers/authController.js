// // ===================================================
// CONTROLADOR DE AUTENTICAÇÃO (controllers/authController.js)
// Versão completa com login e logout
// ===================================================
const { getTenantDB } = require('../config/database');
const bcrypt = require('bcryptjs');

const authController = {

  // NOME DA FUNÇÃO: showLoginPage
  showLoginPage: (req, res) => {
    res.render('login', { error: null });
  },

  // NOME DA FUNÇÃO: loginUser
  loginUser: async (req, res) => {
    const { email, password } = req.body;
    const { tenantId } = req;

    try {
      if (!tenantId) {
        return res.status(400).render('login', { error: "Inquilino não identificado. Aceda através de um subdomínio." });
      }
      
      const dbPool = await getTenantDB(tenantId);
      
      const sql = 'SELECT * FROM Employee WHERE email = ? LIMIT 1';
      const [rows] = await dbPool.execute(sql, [email]);
      const user = rows[0];

      if (!user) {
        return res.render('login', { error: 'Credenciais inválidas.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      
      if (!passwordMatch) {
        return res.render('login', { error: 'Credenciais inválidas.' });
      }
      
      req.session.loggedIn = true; 
      req.session.user = {
          id: user.id_employee,
          email: user.email,
          name: user.name
      };
      
      res.redirect('/dashboard');

    } catch (error) {
      console.error(`[AUTH] Erro crítico durante o login para '${tenantId}':`, error);
      res.status(500).render('login', { error: "Ocorreu um erro interno no servidor." });
    }
  },

  // NOME DA FUNÇÃO: logoutUser (Esta função estava em falta)
  logoutUser: (req, res) => {
    // Destrói a sessão do utilizador
    req.session.destroy(err => {
      if (err) {
        // Se houver um erro ao destruir a sessão, regista o erro no terminal
        console.error('Erro ao fazer logout:', err);
        return res.status(500).send('Não foi possível fazer logout.');
      }
      
      // Após destruir a sessão com sucesso, redireciona o utilizador para a página de login
      res.redirect('/login');
    });
  }
};

module.exports = authController;

