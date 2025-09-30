// models/Funcionario.js

// Simulação do banco de dados de funcionários
const funcionarios = [
    { 
        id_funcionario: 1, 
        nome: 'Admin', 
        email: 'admin@stockex.com', 
        password: '1234', // Apenas para simulação
        two_factor_secret: null, // Armazenará o segredo do 2FA
        two_factor_enabled: false // Define se o 2FA está ativo
    },
    // ... outros funcionários ...
];

const Funcionario = {
    findByEmail: (email) => {
        return funcionarios.find(f => f.email === email);
    },
    
    // Salva o segredo do 2FA para um usuário
    save2FASecret: (email, secret) => {
        const user = Funcionario.findByEmail(email);
        if (user) {
            user.two_factor_secret = secret;
            user.two_factor_enabled = true;
            console.log(`2FA ativado para ${email}`);
        }
    }
};

module.exports = Funcionario;