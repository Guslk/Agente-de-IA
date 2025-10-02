// controllers/ativacaoController.js
console.log(">>> O arquivo ativacaoController.js foi carregado com sucesso!"); // Linha de debug

const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const Funcionario = require('../models/Funcionario');

const ativacaoController = {
    // Função para gerar o segredo e mostrar a página de configuração
    showSetupPage: (req, res) => {
        try {
            console.log(">>> A função showSetupPage foi chamada!"); // Linha de debug
            const secret = speakeasy.generateSecret({
                name: `StockEx (${req.session.user.email})`
            });

            req.session.temp_2fa_secret = secret.base32;

            qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
                if (err) {
                    console.error("Erro ao gerar QR Code:", err);
                    return res.status(500).send("Erro ao gerar QR Code.");
                }
                res.render('ativar-2fa', { qrCodeUrl: data_url, error: null, paginaAtiva: '' });
            });
        } catch(error) {
            console.error("Erro em showSetupPage:", error);
            res.status(500).send("Erro interno ao configurar 2FA.");
        }
    },

    // Função para verificar o código e ativar o 2FA
    verifyAndEnable: (req, res) => {
        const { token } = req.body;
        const secret = req.session.temp_2fa_secret;

        if (!secret) {
            return res.redirect('/ativacao/ativar-2fa');
        }

        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
    Funcionario.save2FASecret(req.session.user.email, secret);
    delete req.session.temp_2fa_secret;

    // Redireciona para a nova página de sucesso
    res.redirect('/ativacao/sucesso');
        } else {
            // Recarrega a página com uma mensagem de erro
            // Precisamos gerar o QR Code novamente ou lidar com isso de outra forma, mas por enquanto:
            res.redirect('/ativacao/ativar-2fa'); // Simplificado por enquanto
        }
    },
    showSuccessPage: (req, res) => {
        // Passamos os dados do usuário para o cabeçalho funcionar corretamente
        res.render('ativacao-sucesso', { 
            user: req.session.user, 
            paginaAtiva: '' 
        });
    }
};

module.exports = ativacaoController;