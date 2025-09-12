// models/Funcionario.js

const funcionarios = [
    { 
        id_funcionario: 1, 
        nome: 'João da Silva', 
        cargo: 'Almoxarife Chefe', 
        email: 'joao.silva@stockex.com' 
    },
    { 
        id_funcionario: 2, 
        nome: 'Maria Oliveira', 
        cargo: 'Assistente de Logística', 
        email: 'maria.oliveira@stockex.com' 
    },
    { 
        id_funcionario: 3, 
        nome: 'Pedro Martins', 
        cargo: 'Estoquista', 
        email: 'pedro.martins@stockex.com' 
    },
    { 
        id_funcionario: 4, 
        nome: 'Ana Costa', 
        cargo: 'Gerente de Estoque', 
        email: 'ana.costa@stockex.com' 
    }
];

const Funcionario = {
    // Busca todos os funcionários
    findAll: () => {
        return funcionarios;
    }
};

module.exports = Funcionario;