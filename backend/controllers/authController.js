
// /// ===================================================
// // CONTROLADOR DE AUTENTICAÇÃO (controllers/authController.js)
// // Versão corrigida com lógica de base de dados multi-tenant
// // ===================================================
// const { getTenantDB } = require('../config/database');
// const bcrypt = require('bcryptjs'); // Descomente quando implementar a encriptação de senhas

// const authController = {

//   // Função para MOSTRAR a página de login
//   showLoginPage: (req, res) => {
//     res.render('login', { error: null });
//   },

//   // Função para PROCESSAR a tentativa de login (agora assíncrona)
//   loginUser: async (req, res) => {
//     const { email, password } = req.body;
//     // O tenantId é injetado pelo middleware tenantIdentifier
//     const { tenantId } = req;

//     try {
//       if (!tenantId) {
//         // Este erro acontece se o acesso não for feito por um subdomínio
//         return res.status(400).render('login', { error: "Inquilino não identificado. Aceda através de um subdomínio." });
//       }

//       console.log(`[AUTH] A processar login para o inquilino '${tenantId}' com o email '${email}'.`);
      
//       // ==========================================================
//       // AQUI É ONDE EXECUTAMOS A FUNÇÃO getTenantDB
//       // ==========================================================
//       const dbPool = await getTenantDB(tenantId);
      
//       // A conexão foi bem-sucedida se o código chegou até aqui sem erros.
//       // A mensagem de sucesso já foi impressa no console pelo 'getTenantDB'.
//       console.log('[AUTH] Teste de conexão com o MySQL bem-sucedido. Nenhuma verificação de usuário foi realizada.');

//       // Envia uma resposta simples para o navegador para indicar sucesso no teste.
//     //   return res.send('<h1>Teste de conexão com o MySQL bem-sucedido!</h1><p>Verifique o terminal para ver a mensagem de confirmação do pool de conexões.</p>');

      
      
//       // Substitua 'users' pelo nome real da sua tabela de utilizadores
//       const sql = 'SELECT * FROM Employee WHERE email = ? LIMIT 1';
//       const [rows] = await dbPool.execute(sql, [email]);
//       const user = rows[0];

//       if (!user) {
//         console.log(`[AUTH] Login falhou: Utilizador '${email}' não encontrado.`);
//         return res.render('login', { error: 'Credenciais inválidas.' });
//       }

//       // LÓGICA DE SENHA (NÃO SEGURO PARA PRODUÇÃO)
//       // Substitua por 'bcrypt.compare' num ambiente real
//       if (password !== user.password) {
//           console.log(`[AUTH] Login falhou: Senha incorreta para o utilizador '${email}'.` + rows[0].password);
//           return res.render('login', { error: 'Credenciais inválidas.' });
//       }

//       console.log(`[AUTH] Login bem-sucedido para o utilizador:`, user.email);
      
//       // Cria a sessão
//       req.session.loggedIn = true; 
//       req.session.user = {
//           id: user.id, // Guarde o ID ou outras informações úteis
//           email: user.email
//       };
      
//       // Redireciona para o painel de controlo ou página principal
//       res.redirect('/dashboard');
      
      

//     } catch (error) {
//       console.error(`[AUTH] Erro crítico durante o login para '${tenantId}':`, error);
//       res.status(500).render('login', { error: "Ocorreu um erro interno no servidor." });
//     }
//   }
// };

// module.exports = authController;


// ===================================================
// CONTROLADOR DE AUTENTICAÇÃO (controllers/authController.js)
// Versão segura com bcrypt e alinhada à sua base de dados
// ===================================================
const { getTenantDB } = require('../config/database');
const bcrypt = require('bcryptjs'); // Importa a biblioteca para encriptação

const authController = {

  // Função para MOSTRAR a página de login
  showLoginPage: (req, res) => {
    res.render('login', { error: null });
  },

  // Função para PROCESSAR a tentativa de login (agora assíncrona)
  loginUser: async (req, res) => {
    const { email, password } = req.body;
    // O tenantId é injetado pelo middleware tenantIdentifier
    const { tenantId } = req;

    try {
      if (!tenantId) {
        return res.status(400).render('login', { error: "Inquilino não identificado. Aceda através de um subdomínio." });
      }

      console.log(`[AUTH] A processar login para o inquilino '${tenantId}' com o email '${email}'.`);
      
      // Obtém a conexão com a base de dados MySQL do inquilino
      const dbPool = await getTenantDB(tenantId);
      
      // Altera a consulta para a sua tabela 'employees'
      const sql = 'SELECT * FROM Employee WHERE email = ? LIMIT 1';
      const [rows] = await dbPool.execute(sql, [email]);
      const user = rows[0];

      // Se o utilizador não for encontrado, as credenciais são inválidas
      if (!user) {
        console.log(`[AUTH] Login falhou: Utilizador '${email}' não encontrado.`);
        return res.render('login', { error: 'Credenciais inválidas.' });
      }

      // Compara a senha enviada no formulário com o hash guardado na base de dados
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      // Se as senhas não corresponderem, as credenciais são inválidas
      if (!passwordMatch) {
          console.log(`[AUTH] Login falhou: Senha incorreta para o utilizador '${email}'.`);
          return res.render('login', { error: 'Credenciais inválidas.' });
      }

      // Se tudo estiver correto, o login é bem-sucedido
      console.log(`[AUTH] Login bem-sucedido para o utilizador:`, user.email);
      
      // Cria a sessão para manter o utilizador autenticado
      req.session.loggedIn = true; 
      req.session.user = {
          id: user.id_employee,
          email: user.email,
          name: user.name
      };
      
      // Redireciona para a página principal da aplicação
    res.redirect('/dashboard');

    } catch (error) {
      console.error(`[AUTH] Erro crítico durante o login para '${tenantId}':`, error);
      res.status(500).render('login', { error: "Ocorreu um erro interno no servidor." });
    }
  }
};

module.exports = authController;

