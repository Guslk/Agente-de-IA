// controllers/authController.js
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { getTenantDB } = require('../config/database');
const db = require('../models'); // Importa o carregador de modelos padrão

const DUMMY_HASH = '$2b$10$fakeHashForTimingAttack.0123456789ABCDEF01234'; 

/**
 * Função auxiliar para finalizar o login e salvar a sessão completa
 */
const finalizeLogin = (req, user) => {
    req.session.loggedIn = true;
    req.session.user = {
        id: user.id, 
        email: user.email,
        name: user.name,
        position: user.position,
        role: user.role
    };
    // Limpa quaisquer sinalizadores pendentes
    delete req.session.two_factor_pending;
    delete req.session.force_password_change_pending;
    delete req.session.setup_2fa_pending;
    delete req.session.partial_login_user_id;
};

const authController = {
    /**
     * Exibe a página de login
     */
    showLoginPage: (req, res) => {
        res.render('login', { error: req.query.error || null, success: null });
    },

    /**
     * Processa a tentativa de login (Etapa 1: Senha)
     */
    loginUser: async (req, res) => {
        const { email, password } = req.body;
        const { tenantId } = req;

        try {
            if (!tenantId) {
                return res.status(400).render('login', { error: "Inquilino não identificado.", success: null });
            }
            if (!email || !password) {
                return res.render('login', { error: 'E-mail e senha são obrigatórios.', success: null });
            }

            const sequelize = await getTenantDB(tenantId);
            const { Employee } = db.initialize(sequelize); // Usa o db.initialize
            const user = await Employee.findOne({ where: { email } });

            const hashToCompare = user ? user.passwordHash : DUMMY_HASH; // Usa passwordHash (camelCase)
            if (!hashToCompare) {
                console.error(`[AUTH-SECURITY] Usuário '${email}' encontrado, mas não possui hash de senha.`);
                return res.render('login', { error: 'Credenciais inválidas.', success: null });
            }

            const passwordMatch = await bcrypt.compare(password, hashToCompare);

            if (!user || !passwordMatch) {
                return res.render('login', { error: 'Credenciais inválidas.', success: null });
            }

            req.session.regenerate((err) => {
                if (err) {
                    console.error('[SESSION-ERROR] Falha ao regenerar a sessão:', err);
                    return res.status(500).render('login', { error: 'Ocorreu um erro interno no servidor.', success: null });
                }

                req.session.partial_login_user_id = user.id;
                req.session.tenantId = tenantId;

                // ETAPA 2: Verificar se precisa trocar a senha
                if (user.forcePasswordChange) {
                    req.session.force_password_change_pending = true;
                    return res.redirect('/change-password');
                }

                // ETAPA 3: Verificar 2FA se já estiver ativo
                if (user.twoFactorEnabled && user.twoFactorSecret) {
                    req.session.two_factor_pending = true;
                    return res.redirect('/verify-2fa');
                }

                finalizeLogin(req, user);
                return res.redirect('/itens'); // Redireciona para a página de itens
            });
        } catch (error) {
            console.error(`[AUTH] Erro crítico durante o login para '${tenantId}':`, error);
            res.status(500).render('login', { error: "Ocorreu um erro interno no servidor.", success: null });
        }
    },

    /**
     * Mostra a página "Trocar Senha"
     */
    showChangePasswordPage: (req, res) => {
        if (!req.session.force_password_change_pending) return res.redirect('/login');
        res.render('change-password', { error: null });
    },

    /**
     * Processa a troca de senha do primeiro login
     */
    postChangePassword: async (req, res) => {
        if (!req.session.force_password_change_pending || !req.session.partial_login_user_id) return res.redirect('/login');

        const { password, confirmPassword } = req.body;
        const { tenantId, partial_login_user_id } = req.session;

        if (password !== confirmPassword) return res.render('change-password', { error: 'As senhas não coincidem.' });
        
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Employee } = db.initialize(sequelize);
            const user = await Employee.findByPk(partial_login_user_id);

            if (!user) throw new Error('Usuário não encontrado.');

            user.passwordHash = await bcrypt.hash(password, 10);
            user.forcePasswordChange = false;
            await user.save();
            
            delete req.session.force_password_change_pending;

            if (!user.twoFactorEnabled) { 
                req.session.setup_2fa_pending = true;
                return res.redirect('/setup-2fa');
            }

            if (user.twoFactorEnabled && user.twoFactorSecret) {
                req.session.two_factor_pending = true;
                return res.redirect('/verify-2fa');
            }

            finalizeLogin(req, user);
            return res.redirect('/itens');
        } catch (error) {
            res.render('change-password', { error: 'Ocorreu um erro ao salvar sua nova senha.' });
        }
    },

    /**
     * Mostra a página de CONFIGURAÇÃO do 2FA
     */
    showSetup2FAPage: async (req, res) => {
        if (!req.session.setup_2fa_pending || !req.session.partial_login_user_id) return res.redirect('/login');
        const { tenantId, partial_login_user_id } = req.session;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Employee } = db.initialize(sequelize);
            const user = await Employee.findByPk(partial_login_user_id);

            const secret = speakeasy.generateSecret({ length: 20, name: `StockEx (${user.email})` });
            user.twoFactorSecret = secret.base32; // Salva o segredo no banco
            await user.save();

            qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
                if (err) throw new Error('Não foi possível gerar o QR code.');
                res.render('setup-2fa', { error: null, qrCodeUrl: data_url });
            });
        } catch (error) {
            res.render('setup-2fa', { error: 'Erro ao gerar o QR code.', qrCodeUrl: null });
        }
    },

    /**
     * Processa a VERIFICAÇÃO da configuração do 2FA
     */
    verify2FASetup: async (req, res) => {
        if (!req.session.setup_2fa_pending || !req.session.partial_login_user_id) return res.redirect('/login');

        const { token } = req.body;
        const { tenantId, partial_login_user_id } = req.session;
        
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Employee } = db.initialize(sequelize);
            const user = await Employee.findByPk(partial_login_user_id);

            if (!user || !user.twoFactorSecret) return res.render('setup-2fa', { error: 'Usuário não encontrado ou segredo 2FA não configurado.', qrCodeUrl: null });

            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: token,
                window: 1
            });

            if (verified) {
                user.twoFactorEnabled = true; // ATIVA o 2FA
                await user.save();
                delete req.session.setup_2fa_pending;
                finalizeLogin(req, user); // LOGIN COMPLETO!
                return res.redirect('/itens');
            } else {
                return res.render('setup-2fa', { error: 'Código inválido. Tente novamente.', qrCodeUrl: `data:image/png;base64,...` /* recrie o QR code se necessário */ });
            }
        } catch (error) {
            res.render('setup-2fa', { error: 'Ocorreu um erro interno.', qrCodeUrl: null });
        }
    },

    /**
     * Mostra a página "Verificar 2FA" (para logins normais)
     */
    show2FAPage: (req, res) => {
        if (!req.session.two_factor_pending) return res.redirect('/login');
        res.render('verify-2fa', { error: null });
    },

    /**
     * ======================================================
     * NOME DA FUNÇÃO CORRIGIDO AQUI 👇
     * ======================================================
     * Processa a verificação do token 2FA (para logins normais)
     */
    verify2FA: async (req, res) => {
        if (!req.session.two_factor_pending || !req.session.partial_login_user_id) return res.redirect('/login');

        const { token } = req.body;
        const { tenantId, partial_login_user_id } = req.session;
        
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Employee } = db.initialize(sequelize); // Usa o db.initialize
            const user = await Employee.findByPk(partial_login_user_id);

            if (!user || !user.twoFactorSecret) { // Usa twoFactorSecret (camelCase)
                return res.render('verify-2fa', { error: 'Usuário não encontrado ou 2FA não configurado.' });
            }

            const verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret, // Usa twoFactorSecret (camelCase)
                encoding: 'base32',
                token: token,
                window: 1
            });

            if (verified) {
                finalizeLogin(req, user);
                return res.redirect('/itens');
            } else {
                return res.render('verify-2fa', { error: 'Código inválido.' });
            }
        } catch (error) {
            console.error("Error verifying 2FA:", error);
            res.render('verify-2fa', { error: 'Ocorreu um erro interno.' });
        }
    },

    logoutUser: (req, res) => {
        req.session.destroy(err => {
          if (err) { console.error('Erro ao fazer logout:', err); }
          res.redirect('/login');
        });
    }
};
module.exports = authController;

// // controllers/authController.js
// const bcrypt = require('bcryptjs');
// const speakeasy = require('speakeasy');
// const qrcode = require('qrcode');
// const { getTenantDB } = require('../config/database'); // Importa a função de obter conexão
// const getModels = require('../models'); // Importa a função getModels do index.js

// const DUMMY_HASH = '$2b$10$fakeHashForTimingAttack.0123456789ABCDEF01234'; 

// /**
//  * Função auxiliar para finalizar o login e salvar a sessão completa
//  */
// const finalizeLogin = (req, user) => {
//     req.session.loggedIn = true;
//     req.session.user = {
//         id: user.id, 
//         email: user.email,
//         name: user.name,
//         position: user.position,
//         role: user.role,
//         tenantId: req.tenantId // Garante que o tenantId está na sessão
//     };
//     // Limpa quaisquer sinalizadores pendentes
//     delete req.session.two_factor_pending;
//     delete req.session.force_password_change_pending;
//     delete req.session.setup_2fa_pending;
//     delete req.session.partial_login_user_id;
// };

// const authController = {
//     /**
//      * Exibe a página de login
//      */
//     showLoginPage: (req, res) => {
//         res.render('login', { error: req.query.error || null, success: null });
//     },

//     /**
//      * Processa a tentativa de login (Etapa 1: Senha)
//      */
//     loginUser: async (req, res, next) => { // Adicionado 'next' para gerenciamento de erro
//         const { email, password } = req.body;
//         const { tenantId } = req;

//         try {
//             if (!tenantId) {
//                 return res.status(400).render('login', { error: "Domínio não identificado.", success: null });
//             }
//             if (!email || !password) {
//                 return res.render('login', { error: 'E-mail e senha são obrigatórios.', success: null });
//             }

//             // CORREÇÃO: Usa a nova função getModels
//             const { Employee } = await getModels(tenantId); 
//             const user = await Employee.findOne({ where: { email } });

//             const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
//             if (!hashToCompare) {
//                 console.error(`[AUTH-SECURITY] Usuário '${email}' encontrado, mas não possui hash de senha.`);
//                 return res.render('login', { error: 'Credenciais inválidas.', success: null });
//             }

//             const passwordMatch = await bcrypt.compare(password, hashToCompare);

//             if (!user || !passwordMatch) {
//                 return res.render('login', { error: 'Credenciais inválidas.', success: null });
//             }

//             req.session.regenerate((err) => {
//                 if (err) {
//                     console.error('[SESSION-ERROR] Falha ao regenerar a sessão:', err);
//                     return next(err); // Passa para o gerenciador de erros
//                 }

//                 req.session.partial_login_user_id = user.id;
//                 req.session.tenantId = tenantId;

//                 if (user.forcePasswordChange) {
//                     req.session.force_password_change_pending = true;
//                     return res.redirect('/change-password');
//                 }

//                 if (user.twoFactorEnabled && user.twoFactorSecret) {
//                     req.session.two_factor_pending = true;
//                     return res.redirect('/verify-2fa');
//                 }

//                 finalizeLogin(req, user);
//                 return res.redirect('/itens');
//             });
//         } catch (error) {
//             console.error(`[AUTH] Erro crítico durante o login para '${tenantId}':`, error);
//             next(error); // Passa para o gerenciador de erros centralizado
//         }
//     },

//     /**
//      * Mostra a página "Trocar Senha"
//      */
//     showChangePasswordPage: (req, res) => {
//         if (!req.session.force_password_change_pending) return res.redirect('/login');
//         res.render('change-password', { error: null });
//     },

//     /**
//      * Processa a troca de senha do primeiro login
//      */
//     postChangePassword: async (req, res, next) => {
//         if (!req.session.force_password_change_pending || !req.session.partial_login_user_id) return res.redirect('/login');

//         const { password, confirmPassword } = req.body;
//         const { tenantId, partial_login_user_id } = req.session;

//         if (password !== confirmPassword) return res.render('change-password', { error: 'As senhas não coincidem.' });
        
//         try {
//             // CORREÇÃO: Usa a nova função getModels
//             const { Employee } = await getModels(tenantId);
//             const user = await Employee.findByPk(partial_login_user_id);

//             if (!user) throw new Error('Usuário não encontrado.');

//             user.passwordHash = await bcrypt.hash(password, 10);
//             user.forcePasswordChange = false;
//             await user.save();
            
//             delete req.session.force_password_change_pending;

//             if (!user.twoFactorEnabled) { 
//                 req.session.setup_2fa_pending = true;
//                 return res.redirect('/setup-2fa');
//             }

//             if (user.twoFactorEnabled && user.twoFactorSecret) {
//                 req.session.two_factor_pending = true;
//                 return res.redirect('/verify-2fa');
//             }

//             finalizeLogin(req, user);
//             return res.redirect('/itens');
//         } catch (error) {
//             console.error("[AUTH] Erro ao salvar nova senha:", error);
//             next(error);
//         }
//     },

//     /**
//      * Mostra a página de CONFIGURAÇÃO do 2FA
//      */
//     showSetup2FAPage: async (req, res, next) => {
//         if (!req.session.setup_2fa_pending || !req.session.partial_login_user_id) return res.redirect('/login');
//         const { tenantId, partial_login_user_id } = req.session;
//         try {
//             // CORREÇÃO: Usa a nova função getModels
//             const { Employee } = await getModels(tenantId);
//             const user = await Employee.findByPk(partial_login_user_id);

//             const secret = speakeasy.generateSecret({ length: 20, name: `StockEx (${user.email})` });
//             user.twoFactorSecret = secret.base32; // Salva o segredo no banco
//             await user.save();

//             qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
//                 if (err) throw new Error('Não foi possível gerar o QR code.');
//                 res.render('setup-2fa', { error: null, qrCodeUrl: data_url });
//             });
//         } catch (error) {
//             console.error("[AUTH] Erro ao gerar QR code:", error);
//             next(error);
//         }
//     },

//     /**
//      * Processa a VERIFICAÇÃO da configuração do 2FA
//      */
//     verify2FASetup: async (req, res, next) => {
//         if (!req.session.setup_2fa_pending || !req.session.partial_login_user_id) return res.redirect('/login');

//         const { token } = req.body;
//         const { tenantId, partial_login_user_id } = req.session;
        
//         try {
//             // CORREÇÃO: Usa a nova função getModels
//             const { Employee } = await getModels(tenantId);
//             const user = await Employee.findByPk(partial_login_user_id);

//             if (!user || !user.twoFactorSecret) return res.render('setup-2fa', { error: 'Usuário não encontrado ou segredo 2FA não configurado.', qrCodeUrl: null });

//             const verified = speakeasy.totp.verify({
//                 secret: user.twoFactorSecret,
//                 encoding: 'base32',
//                 token: token,
//                 window: 1
//             });

//             if (verified) {
//                 user.twoFactorEnabled = true; // ATIVA o 2FA
//                 await user.save();
//                 delete req.session.setup_2fa_pending;
//                 finalizeLogin(req, user); // LOGIN COMPLETO!
//                 return res.redirect('/itens');
//             } else {
//                 // Se o código for inválido, precisamos recriar o QR Code para a view
//                 qrcode.toDataURL(`otpauth://totp/StockEx (${user.email})?secret=${user.twoFactorSecret}`, (err, data_url) => {
//                    return res.render('setup-2fa', { error: 'Código inválido. Tente novamente.', qrCodeUrl: data_url });
//                 });
//             }
//         } catch (error) {
//             console.error("[AUTH] Erro ao verificar setup 2FA:", error);
//             next(error);
//         }
//     },

//     /**
//      * Mostra a página "Verificar 2FA" (para logins normais)
//      */
//     show2FAPage: (req, res) => {
//         if (!req.session.two_factor_pending) return res.redirect('/login');
//         res.render('verify-2fa', { error: null });
//     },

//     /**
//      * Processa a verificação do token 2FA (para logins normais)
//      */
//     verify2FA: async (req, res, next) => {
//         if (!req.session.two_factor_pending || !req.session.partial_login_user_id) return res.redirect('/login');

//         const { token } = req.body;
//         const { tenantId, partial_login_user_id } = req.session;
        
//         try {
//             // CORREÇÃO: Usa a nova função getModels
//             const { Employee } = await getModels(tenantId);
//             // CORREÇÃO: Removido o caractere '_' que estava causando o SyntaxError
//             const user = await Employee.findByPk(partial_login_user_id);

//             if (!user || !user.twoFactorSecret) {
//                 return res.render('verify-2fa', { error: 'Usuário não encontrado ou 2FA não configurado.' });
//             }

//             const verified = speakeasy.totp.verify({
//                 secret: user.twoFactorSecret,
//                 encoding: 'base32',
//                 token: token,
//                 window: 1
//             });

//             if (verified) {
//                 finalizeLogin(req, user);
//                 return res.redirect('/itens');
//             } else {
//                 return res.render('verify-2fa', { error: 'Código inválido.' });
//             }
//         } catch (error) {
//             console.error("[AUTH] Erro ao verificar 2FA:", error);
//             next(error);
//         }
//     },

//     logoutUser: (req, res, next) => {
//         req.session.destroy(err => {
//           if (err) { 
//             console.error('Erro ao fazer logout:', err); 
//             return next(err);
//           }
//           res.redirect('/login');
//         });
//     }
// };
// module.exports = authController;
