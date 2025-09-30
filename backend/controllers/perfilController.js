    // controllers/perfilController.js
    
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
// const Funcionario = require('../models/Funcionario'); // Seu model de funcionário

const perfilController = {
    // Gera o segredo e mostra a página de configuração do 2FA
    setup2FA: (req, res) => {
        // Gera um novo segredo único para o usuário
        const secret = speakeasy.generateSecret({
            name: `StockEx (${req.session.user.email})` // Nome que aparece no app do usuário
        });

        // Salva o segredo temporariamente na sessão até que seja verificado
        req.session.two_factor_temp_secret = secret.base32;

        // Gera o QR Code
        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) {
                return res.status(500).send("Erro ao gerar QR Code.");
            }
            // Renderiza uma nova view para o setup, passando o QR Code
            res.render('ativar-2fa', { qrCodeUrl: data_url });
        });
    },
    verify2FA: (req, res) => {
    const { token } = req.body;
    const secret = req.session.two_factor_temp_secret;

    // Verifica se o token do usuário é válido
    const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token
    });

    if (verified) {
        // Se for válido, salve o segredo permanentemente no banco de dados do usuário
        // const userId = req.session.user.id;
        // Funcionario.update(userId, { two_factor_secret: secret, two_factor_enabled: true });

        delete req.session.two_factor_temp_secret; // Limpa o segredo temporário
        res.send("2FA ativado com sucesso!"); // Ou redireciona para o perfil
    } else {
        res.send("Código inválido. Tente novamente."); // Ou renderiza a página com erro
    }
},
    // ... outras funções do perfil ...
};

router.post('/verificar-2fa', perfilController.verify2FA);

module.exports = perfilController;