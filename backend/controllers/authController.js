// controllers/authController.js

const Funcionario = require('../models/Funcionario'); // << 1. IMPORTAR O MODEL DE FUNCIONÁRIO
const speakeasy = require('speakeasy');

const authController = {
    showLoginPage: (req, res) => {
        res.render('login', { error: null });
    },

    loginUser: (req, res) => {
        const { email, password } = req.body;
        
        // 2. BUSCAR O USUÁRIO DE VERDADE NO NOSSO MODEL
        const user = Funcionario.findByEmail(email);

        // Verifica se o usuário existe e se a senha está correta (mantendo a simulação da senha)
        if (user && password === '1234') {
            
            // 3. VERIFICA O STATUS REAL DO 2FA DO USUÁRIO ENCONTRADO
            if (user.two_factor_enabled) {
                // Se o 2FA estiver ativado no model, redireciona para a verificação
                req.session.two_factor_pending = true;
                req.session.two_factor_user_email = user.email;
                res.redirect('/login/verificar-2fa');
            } else {
                // Se o 2FA NÃO estiver ativado, faz o login normal
                req.session.loggedIn = true;
                req.session.user = { email: user.email, nome: user.nome };
                res.redirect('/');
            }
        } else {
            // Credenciais inválidas...
            res.render('login', { error: 'Credenciais inválidas.' });
        }
    },
    
    // ... (suas outras funções, como logoutUser, show2FAPage, etc. continuam aqui) ...
    logoutUser: (req, res) => {
        req.session.destroy(err => {
            if (err) {
                console.log("Erro ao destruir a sessão:", err);
                return res.redirect('/');
            }
            res.clearCookie('connect.sid');
            res.redirect('/login');
        });
    },

    show2FAPage: (req, res) => {
        if (!req.session.two_factor_pending) {
            return res.redirect('/login');
        }
        res.render('verificar-2fa', { error: null });
    },

    verifyLogin2FA: (req, res) => {
        if (!req.session.two_factor_pending) {
            return res.redirect('/login');
        }

        const { token } = req.body;
        const email = req.session.two_factor_user_email;
        const user = Funcionario.findByEmail(email);

        if (!user || !user.two_factor_secret) {
            return res.render('verificar-2fa', { error: 'Usuário não encontrado ou 2FA não configurado.' });
        }

        const secret = user.two_factor_secret;
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 1
        });

        if (verified) {
            req.session.loggedIn = true;
            req.session.user = { email: email, nome: user.nome };
            delete req.session.two_factor_pending;
            delete req.session.two_factor_user_email;
            res.redirect('/');
        } else {
            res.render('verificar-2fa', { error: 'Código inválido.' });
        }
    }
};

module.exports = authController;