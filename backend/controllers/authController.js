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
    // Converte a photo BLOB para base64
    const photoBase64 = blobToBase64(user.photo);
    
    req.session.loggedIn = true;
    req.session.user = {
        id: user.id, 
        email: user.email,
        name: user.name,
        position: user.position,
        role: user.role,
        photo: photoBase64 // ← Agora em formato base64
    };
    
    console.log('[SESSION] Usuário logado:', {
        id: user.id,
        name: user.name,
        hasPhoto: !!photoBase64
    });
    
    // Limpa quaisquer sinalizadores pendentes
    delete req.session.two_factor_pending;
    delete req.session.force_password_change_pending;
    delete req.session.setup_2fa_pending;
    delete req.session.partial_login_user_id;
};

const blobToBase64 = (blobData) => {
    if (!blobData) return null;
    
    try {
        // Se já for uma string (base64 ou URL), retorna como está
        if (typeof blobData === 'string') {
            if (blobData.startsWith('data:') || blobData.startsWith('http')) {
                return blobData;
            }
            // Se for base64 sem prefixo, adiciona o prefixo de imagem
            return `data:image/jpeg;base64,${blobData}`;
        }
        
        // Se for Buffer (BLOB do MySQL)
        if (Buffer.isBuffer(blobData)) {
            const base64 = blobData.toString('base64');
            return `data:image/jpeg;base64,${base64}`;
        }
        
        return null;
    } catch (error) {
        console.error('[BLOB-CONVERSION] Erro ao converter BLOB:', error);
        return null;
    }
};
const authController = {
    show2FAPage: (req, res) => {
        console.log('[2FA-PAGE] Verificando sessão:', {
            two_factor_pending: req.session.two_factor_pending,
            partial_login_user_id: req.session.partial_login_user_id,
            sessionID: req.sessionID
        });

        if (!req.session.two_factor_pending || !req.session.partial_login_user_id) {
            console.log('[2FA-PAGE] Sessão inválida - redirecionando para login');
            return res.redirect('/login?error=session_expired');
        }

        res.render('verify-2fa', { error: null });
    },

    /**
     * Processa a verificação do token 2FA
     */
    verify2FA: async (req, res) => {
    console.log('[2FA-VERIFY] Iniciando verificação - Sessão:', {
        two_factor_pending: req.session.two_factor_pending,
        partial_login_user_id: req.session.partial_login_user_id,
        sessionID: req.sessionID
    });

    if (!req.session.two_factor_pending || !req.session.partial_login_user_id || !req.session.tenantId) {
        console.log('[2FA-VERIFY] Sessão incompleta - redirecionando');
        return res.redirect('/login?error=session_incomplete');
    }

    const { token } = req.body;
    const { tenantId, partial_login_user_id } = req.session;
    
    console.log(`[2FA-VERIFY] Token recebido: ${token}, UserID: ${partial_login_user_id}`);
    
    if (!token || token.length !== 6) {
        console.log('[2FA-VERIFY] Token inválido ou em formato errado');
        return res.render('verify-2fa', { error: 'Código deve ter 6 dígitos.' });
    }

    try {
        const sequelize = await getTenantDB(tenantId);
        const { Employee } = db.initialize(sequelize);
        
        // BUSCA INCLUINDO PHOTO
        const user = await Employee.findByPk(partial_login_user_id, {
            attributes: { include: ['photo'] }
        });

        if (!user) {
            console.log('[2FA-VERIFY] Usuário não encontrado no banco');
            return res.render('verify-2fa', { error: 'Usuário não encontrado.' });
        }

        if (!user.twoFactorSecret) {
            console.log('[2FA-VERIFY] Usuário sem segredo 2FA configurado');
            return res.render('verify-2fa', { error: '2FA não configurado para este usuário.' });
        }

        console.log(`[2FA-VERIFY] Verificando token com segredo: ${user.twoFactorSecret.substring(0, 10)}...`);

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token.replace(/\s/g, ''),
            window: 2
        });

        console.log(`[2FA-VERIFY] Resultado da verificação: ${verified}`);

        if (verified) {
            console.log('[2FA-VERIFY] Token válido - finalizando login');
            
            // Salva a sessão ANTES do redirect
            finalizeLogin(req, user);
            
            req.session.save((err) => {
                if (err) {
                    console.error('[2FA-VERIFY] Erro ao salvar sessão:', err);
                    return res.render('verify-2fa', { error: 'Erro ao processar login.' });
                }
                console.log('[2FA-VERIFY] Sessão salva - redirecionando para /itens');
                return res.redirect('/itens');
            });
        } else {
            console.log('[2FA-VERIFY] Token inválido');
            
            const currentToken = speakeasy.totp({
                secret: user.twoFactorSecret,
                encoding: 'base32'
            });
            console.log(`[2FA-VERIFY] Token atual esperado: ${currentToken}`);
            
            return res.render('verify-2fa', { 
                error: 'Código inválido. Verifique se digitou corretamente e se o horário do seu aplicativo está sincronizado.' 
            });
        }
    } catch (error) {
        console.error("[2FA-VERIFY] Erro crítico:", error);
        res.render('verify-2fa', { error: 'Ocorreu um erro interno no servidor.' });
    }
},

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
        const { Employee } = db.initialize(sequelize);
        
        // BUSCA INCLUINDO A PHOTO (BLOB)
        const user = await Employee.findOne({ 
            where: { email },
            attributes: { include: ['photo'] }
        });

        const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
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

            // Debug: verificar photo
            console.log('[LOGIN] Photo data type:', typeof user.photo);
            console.log('[LOGIN] Is buffer:', Buffer.isBuffer(user.photo));
            console.log('[LOGIN] Photo length:', user.photo ? user.photo.length : 'null');

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
            return res.redirect('/itens');
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

        // try {
        //     const sequelize = await getTenantDB(tenantId);
        //     const { Employee } = db.initialize(sequelize);
        //     const user = await Employee.findByPk(partial_login_user_id);

        //     if (!user) throw new Error('Usuário não encontrado.');

        //     user.passwordHash = await bcrypt.hash(password, 10);
        //     user.forcePasswordChange = false;
        //     await user.save();

        //     delete req.session.force_password_change_pending;

        //     if (!user.twoFactorEnabled) {
        //         req.session.setup_2fa_pending = true;
        //         return res.redirect('/setup-2fa');
        //     }

        //     if (user.twoFactorEnabled && user.twoFactorSecret) {
        //         req.session.two_factor_pending = true;
        //         return res.redirect('/verify-2fa');
        //     }

        //     finalizeLogin(req, user);
        //     return res.redirect('/itens');
        // } catch (error) {
        //     res.render('change-password', { error: 'Ocorreu um erro ao salvar sua nova senha.' });
        // }
        try {
        const sequelize = await getTenantDB(tenantId);
        const { Employee } = db.initialize(sequelize);
const user = await Employee.findByPk(partial_login_user_id, {
    attributes: { include: ['photo'] }
});

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

        finalizeLogin(req, user); // ← Já inclui a photo agora
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

        // try {
        //     const sequelize = await getTenantDB(tenantId);
        //     const { Employee } = db.initialize(sequelize);
        //     const user = await Employee.findByPk(partial_login_user_id);

        //     if (!user || !user.twoFactorSecret) return res.render('setup-2fa', { error: 'Usuário não encontrado ou segredo 2FA não configurado.', qrCodeUrl: null });

        //     const verified = speakeasy.totp.verify({
        //         secret: user.twoFactorSecret,
        //         encoding: 'base32',
        //         token: token,
        //         window: 1
        //     });

        //     if (verified) {
        //         user.twoFactorEnabled = true; // ATIVA o 2FA
        //         await user.save();
        //         delete req.session.setup_2fa_pending;
        //         finalizeLogin(req, user); // LOGIN COMPLETO!
        //         return res.redirect('/itens');
        //     } else {
        //         return res.render('setup-2fa', { error: 'Código inválido. Tente novamente.', qrCodeUrl: `data:image/png;base64,...` /* recrie o QR code se necessário */ });
        //     }
        // } catch (error) {
        //     res.render('setup-2fa', { error: 'Ocorreu um erro interno.', qrCodeUrl: null });
        // }
        try {
        const sequelize = await getTenantDB(tenantId);
        const { Employee } = db.initialize(sequelize);
        const user = await Employee.findByPk(partial_login_user_id, {
            attributes: { include: ['photo'] } // ← Inclui a photo
        });

        if (!user || !user.twoFactorSecret) return res.render('setup-2fa', { error: 'Usuário não encontrado ou segredo 2FA não configurado.', qrCodeUrl: null });

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 1
        });

        if (verified) {
            user.twoFactorEnabled = true;
            await user.save();
            delete req.session.setup_2fa_pending;
            finalizeLogin(req, user); // ← Já inclui a photo
            return res.redirect('/itens');
        } else {
            return res.render('setup-2fa', { error: 'Código inválido. Tente novamente.', qrCodeUrl: `data:image/png;base64,...` });
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



    logoutUser: (req, res) => {
        req.session.destroy(err => {
            if (err) { console.error('Erro ao fazer logout:', err); }
            res.redirect('/login');
        });
    },

    
};
module.exports = authController;
