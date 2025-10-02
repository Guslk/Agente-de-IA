// models/Funcionario.js

const funcionarios = [
    { 
        id_funcionario: 1, 
        nome: 'João da Silva (Admin)', 
        cargo: 'Almoxarife Chefe',
        email: 'admin@stockex.com', 
        password: '1234',
        two_factor_secret: null, // No futuro, este virá do banco
        two_factor_enabled: false
    },
    { 
        id_funcionario: 2, 
        nome: 'Maria Oliveira', 
        cargo: 'Assistente de Logística',
        email: 'maria.oliveira@stockex.com',
        password: '1234',
        two_factor_secret: null,
        two_factor_enabled: false
    },
    { 
        id_funcionario: 3, 
        nome: 'Pedro Martins', 
        cargo: 'Estoquista',
        email: 'pedro.martins@stockex.com',
        password: '1234',
        two_factor_secret: null,
        two_factor_enabled: false
    }
];

const Funcionario = {
   
    findAll: () => {
        return funcionarios;
    },

    findByEmail: (email) => {
        return funcionarios.find(f => f.email === email);
    },
    
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