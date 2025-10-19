// // =================================================================
// CONTROLADOR DE AUTENTICAÇÃO (controllers/authController.js)
// Versão Refatorada com Foco em Segurança e Boas Práticas
// =================================================================

// const { getTenantDB } = require('../config/database');
// const defineEmployeeModel = require('../models/employee');
// const bcrypt = require('bcrypt');
// const speakeasy = require('speakeasy');
// const saltRounds = 10;

// controllers/authController.js
const bcrypt = require('bcrypt');
const { getTenantDB } = require('../config/database');
const db = require('../models'); // Importa o carregador de modelos

const saltRounds = 10;
// Hash falso para mitigação de timing attack

// Um hash falso e estático para usar na mitigação de timing attacks.
// Gerado uma única vez com: bcrypt.hashSync("dummyPassword", 1) para não usar poder de processamento em tempo de execução.
const DUMMY_HASH = '$2a$04$ACZ3vB5MAX1N34O0h57A5eSyHy2zpxfAWhM7P3w65UKCPKx2oivs6';

const authController = {

  showLoginPage: (req, res) => {
    res.render('login', { error: null, success: null });
  },


  // loginUser: async (req, res) => {
  //   const { email, password } = req.body;
  //   const {  tenantId } = req;

  //   try {
  //     if (!tenantId) {
  //       return res.status(400).render('login', { error: "Inquilino não identificado.", success: null });
  //     }

  //     // Validação básica de entrada para evitar processamento desnecessário
  //     if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
  //       return res.render('login', { error: 'E-mail e senha são obrigatórios.', success: null });
  //     }

  //     const sequelize = await getTenantDB(tenantId);
  //     const Employee = defineEmployeeModel(sequelize);
  //     const user = await Employee.findOne({ where: { email } });

  //     // === MITIGAÇÃO DE TIMING ATTACK (ENUMERAÇÃO DE USUÁRIOS) ===
  //     // Se o usuário não for encontrado, usamos um hash falso para a comparação.
  //     // Isso garante que a chamada `bcrypt.compare` (que é lenta) seja executada sempre,
  //     // tornando o tempo de resposta quase idêntico para usuários válidos e inválidos.
  //     const passwordHash = await bcrypt.hash(password, saltRounds);
  //     const hashToCompare = user ? user.password_hash : DUMMY_HASH;

  //     console.log(passwordHash);
  //     console.log(user.password_hash);



  //     // Segurança: Garante que a conta não esteja corrompida (sem senha)
  //     if (!hashToCompare) {
  //       console.error(`[AUTH-SECURITY] O usuário '${email}' foi encontrado, mas não possui hash de senha.`);
  //       // A mensagem de erro para o usuário é genérica para não vazar informações
  //       return res.render('login', { error: 'Credenciais inválidas.', success: null });
  //     }

  //     const passwordMatch = await bcrypt.compare(password, hashToCompare);

  //     // A verificação final (se o usuário existe E a senha bate) acontece DEPOIS da comparação
  //     if (!user || !passwordMatch) {
  //       return res.render('login', { error: 'Credenciais inválidas.', success: null });
  //     }

  //     // === SEGURANÇA DA SESSÃO (PREVENÇÃO DE SESSION FIXATION) ===
  //     // Regenera a sessão para criar um novo ID de sessão seguro após a autenticação.
  //     req.session.regenerate((err) => {
  //       if (err) {
  //         console.error('[SESSION-ERROR] Falha ao regenerar a sessão:', err);
  //         return res.status(500).render('login', { error: 'Ocorreu um erro interno no servidor.', success: null });
  //       }

  //       // Se o 2FA estiver ativo, preparamos a nova sessão para a verificação
  //       if (user.two_factor_enabled && user.two_factor_secret) {
  //         req.session.two_factor_pending = true;
  //         req.session.two_factor_user_email = user.email;
  //         req.session.tenantId = tenantId;
  //         return res.redirect('/verificar-2fa');
  //       }

  //       // Armazena os dados do usuário na sessão recém-criada e segura
  //       req.session.loggedIn = true;
  //       req.session.user = {
  //           id: user.id_employee,
  //           email: user.email,
  //           name: user.name,
  //           position: user.position,
  //           role: user.role
  //       };
        
  //       res.redirect('/tools');
  //     });

  //   } catch (error) {
  //     console.error(`[AUTH] Erro crítico durante o login para '${tenantId}':`, error);
  //     res.status(500).render('login', { error: "Ocorreu um erro interno no servidor.", success: null });
  //   }
  // },
  loginUser: async (req, res) => {
        const { email, password } = req.body;
        const { tenantId } = req; // tenantId é pego pelo middleware (correto)

        try {
          if (!tenantId) {
            return res.status(400).render('login', { error: "Inquilino não identificado.", success: null });
          }

          if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
            return res.render('login', { error: 'E-mail e senha são obrigatórios.', success: null });
          }

          const sequelize = await getTenantDB(tenantId);
            
            // ======================================================
            //           CORREÇÃO 1: CARREGANDO O MODELO
            // ======================================================
            // Usamos o 'db.initialize' para garantir que estamos
            // carregando o modelo Employee *corrigido* (com 'role', 'passwordHash', etc.)
          const { Employee } = db.initialize(sequelize);
            // ======================================================

          const user = await Employee.findOne({ where: { email } });

            // ======================================================
            //           CORREÇÃO 2: ACESSO À PROPRIEDADE
            // ======================================================
            // O modelo corrigido mapeia 'password_hash' para 'passwordHash'.
            // Removemos também a linha 'bcrypt.hash' desnecessária.
          const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
            // ======================================================

          // Segurança: Garante que a conta não esteja corrompida (sem senha)
          if (!hashToCompare) {
            console.error(`[AUTH-SECURITY] O usuário '${email}' foi encontrado, mas não possui hash de senha.`);
            return res.render('login', { error: 'Credenciais inválidas.', success: null });
          }

          const passwordMatch = await bcrypt.compare(password, hashToCompare);

          if (!user || !passwordMatch) {
            return res.render('login', { error: 'Credenciais inválidas.', success: null });
          }

          // Regenera a sessão para segurança
          req.session.regenerate((err) => {
            if (err) {
              console.error('[SESSION-ERROR] Falha ao regenerar a sessão:', err);
              return res.status(500).render('login', { error: 'Ocorreu um erro interno no servidor.', success: null });
            }

            // Verifica o 2FA (usando as propriedades camelCase do modelo)
            if (user.twoFactorEnabled && user.twoFactorSecret) {
              req.session.two_factor_pending = true;
              req.session.two_factor_user_email = user.email;
              req.session.tenantId = tenantId;
              return res.redirect('/verificar-2fa');
            }

            // Armazena os dados do usuário na sessão
            req.session.loggedIn = true;
            req.session.user = {
                // ======================================================
                //           CORREÇÃO 3: POPULANDO A SESSÃO
                // ======================================================
                // O modelo corrigido mapeia 'id_employee' para 'id'
                id: user.id, 
                email: user.email,
                name: user.name,
                position: user.position,
                // O 'user.role' agora funcionará, pois o modelo corrigido
                // não tem mais o erro de digitação no ENUM.
                role: user.role
            };
            
            res.redirect('/tools');
          });

        } catch (error) {
          console.error(`[AUTH] Erro crítico durante o login para '${tenantId}':`, error);
          res.status(500).render('login', { error: "Ocorreu um erro interno no servidor.", success: null });
        }
    },

  /**
   * Destrói a sessão do usuário para fazer logout.
   */
  logoutUser: (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error('Erro ao fazer logout:', err);
        return res.status(500).send('Não foi possível fazer logout.');
      }
      res.redirect('/login');
    });
  },

  /**
   * Renderiza a página de verificação de 2FA.
   */
  show2FAPage: (req, res) => {
      if (!req.session.two_factor_pending) {
          return res.redirect('/login');
      }
      res.render('verificar-2fa', { error: null });
  },

  /**
   * Verifica o token 2FA fornecido pelo usuário.
   */
  verifyLogin2FA: async (req, res) => {
    if (!req.session.two_factor_pending) {
        return res.redirect('/login');
    }

    const { token } = req.body;
    const email = req.session.two_factor_user_email;
    const tenantId = req.session.tenantId;

    try {
        if (!tenantId) {
            return res.render('verificar-2fa', { error: 'Sessão inválida. Inquilino não encontrado.' });
        }
        
        const sequelize = await getTenantDB(tenantId);
        const Employee = defineEmployeeModel(sequelize);
        const user = await Employee.findOne({ where: { email: email } });

        if (!user || !user.two_factor_secret) {
            return res.render('verificar-2fa', { error: 'Usuário não encontrado ou 2FA não configurado.' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: token,
            window: 1
        });

        if (verified) {
            // Regenerar a sessão aqui também seria uma boa prática, mas para simplificar,
            // vamos apenas finalizar o processo de login na sessão já regenerada.
            req.session.loggedIn = true;
            req.session.user = { id: user.id_employee, email: user.email, name: user.name, position: user.position};
            
            // Limpa os dados temporários do processo 2FA da sessão
            delete req.session.two_factor_pending;
            delete req.session.two_factor_user_email;
            delete req.session.tenantId;
            
            return res.redirect('/dashboard');
        } else {
            return res.render('verificar-2fa', { error: 'Código 2FA inválido.' });
        }
    } catch(error) {
        console.error(`[AUTH-2FA] Erro crítico durante verificação 2FA para '${tenantId}':`, error);
        return res.status(500).render('verificar-2fa', { error: "Ocorreu um erro interno no servidor." });
    }
  }
};

module.exports = authController;