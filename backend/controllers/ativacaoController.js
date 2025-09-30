// controllers/ativacaoController.js
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const Funcionario = require('../models/Funcionario');

const ativacaoController = {
    // Gera o segredo e mostra a página de configuração
    showSetupPage: (req, res) => {
        const secret = speakeasy.generateSecret({
            name: `StockEx (${req.session.user.email})`
        });

        // Salva o segredo temporariamente na sessão
        req.session.temp_2fa_secret = secret.base32;

        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) return res.status(500).send("Erro ao gerar QR Code.");
            res.render('ativar-2fa', { qrCodeUrl: data_url, error: null });
        });
    },

    // Verifica o código e ativa o 2FA permanentemente
    verifyAndEnable: (req, res) => {
        const { token } = req.body;
        const secret = req.session.temp_2fa_secret;

        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            // Se o código for válido, salve o segredo no "banco de dados"
            Funcionario.save2FASecret(req.session.user.email, secret);
            delete req.session.temp_2fa_secret; // Limpa o segredo temporário
            res.send("<h1>Verificação em duas etapas ativada com sucesso!</h1><a href='/'>Voltar para o Dashboard</a>");
        } else {
            // Se o código for inválido, renderize a página novamente com um erro
            const qrCodeUrl = req.body.qrCodeUrl; // Reenvia o QR Code (lógica a ser aprimorada)
            res.render('ativar-2fa', { qrCodeUrl, error: 'Código inválido, tente novamente.' });
        }
    }
};

module.exports = ativacaoController;