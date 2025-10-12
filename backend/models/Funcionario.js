// models/Funcionario.js

let funcionarios = [
    { 
        id_funcionario: 1, 
        nome: 'João da Silva ', 
        cargo: 'Almoxarife Chefe',
        email: 'admin@stockex.com', 
        password: '1234', 
        nivel_acesso: 'Admin',
        foto_url: 'https://i.pravatar.cc/150?u=admin@stockex.com'
    },
    { 
        id_funcionario: 2, 
        nome: 'Maria Oliveira', 
        cargo: 'Assistente de Logística',
        email: 'maria.oliveira@stockex.com',
        password: '1234',
        nivel_acesso: 'Operador',
        foto_url: 'https://i.pravatar.cc/150?u=maria.oliveira@stockex.com'
    },
];

let proximoId = 3;

const Funcionario = {
    findAll: () => {
        return [...funcionarios];
    },
    
    findById: (id) => {
        return funcionarios.find(f => f.id_funcionario === parseInt(id));
    },

    findByEmail: (email) => {
        return funcionarios.find(f => f.email === email);
    },

    create: (dadosFuncionario) => {
        const novoFuncionario = {
            id_funcionario: proximoId++,
            ...dadosFuncionario,
            foto_url: dadosFuncionario.foto_url || `https://i.pravatar.cc/150?u=${dadosFuncionario.email}` // Foto padrão
        };
        funcionarios.push(novoFuncionario);
        console.log("Novo funcionário adicionado:", novoFuncionario);
        return novoFuncionario;
    },

    updateById: (id, dadosFuncionario) => {
        const index = funcionarios.findIndex(f => f.id_funcionario === parseInt(id));
        if (index === -1) return null;

        // Não atualiza a senha se o campo vier vazio
        if (dadosFuncionario.password === '') {
            delete dadosFuncionario.password;
        }

        const funcionarioAtualizado = { ...funcionarios[index], ...dadosFuncionario };
        funcionarios[index] = funcionarioAtualizado;
        console.log("Funcionário atualizado:", funcionarioAtualizado);
        return funcionarioAtualizado;
    },

    deleteById: (id) => {
        const index = funcionarios.findIndex(f => f.id_funcionario === parseInt(id));
        if (index === -1) return null;
        
        const [removido] = funcionarios.splice(index, 1);
        console.log("Funcionário removido:", removido);
        return removido;
    },

    save2FASecret: (email, secret) => {
        const user = Funcionario.findByEmail(email);
        if (user) {
            user.two_factor_secret = secret;
            user.two_factor_enabled = true;
        }
    }
};

module.exports = Funcionario;