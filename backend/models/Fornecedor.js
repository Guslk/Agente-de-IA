// models/Fornecedor.js

const fornecedores = [
    { 
        id_fornecedor: 1, 
        nome_empresa: 'HardDistribuidora', 
        contato: 'Carlos Silva', 
        telefone: '(11) 98765-4321', 
        email: 'carlos@hard.com',
        endereco: 'Rua das Peças, 123, São Paulo - SP'
    },
    { 
        id_fornecedor: 2, 
        nome_empresa: 'PecasNow', 
        contato: 'Ana Pereira', 
        telefone: '(21) 91234-5678', 
        email: 'ana@pecasnow.com',
        endereco: 'Avenida do Hardware, 456, Rio de Janeiro - RJ'
    },
    { 
        id_fornecedor: 3, 
        nome_empresa: 'InfoMega', 
        contato: 'Ricardo Souza', 
        telefone: '(31) 95555-4444', 
        email: 'ricardo@infomega.br',
        endereco: 'Praça da Tecnologia, 789, Belo Horizonte - MG'
    },
];

const Fornecedor = {
    // Busca todos os fornecedores
    findAll: () => {
        return fornecedores;
    }
};

module.exports = Fornecedor;