// models/Fornecedor.js

let fornecedores = [
    { id_fornecedor: 1, nome_empresa: 'HardDistribuidora', contato: 'Carlos Silva', telefone: '(11) 98765-4321', email: 'carlos@hard.com', endereco: 'Rua das Peças, 123, São Paulo - SP' },
    { id_fornecedor: 2, nome_empresa: 'PecasNow', contato: 'Ana Pereira', telefone: '(21) 91234-5678', email: 'ana@pecasnow.com', endereco: 'Avenida do Hardware, 456, Rio de Janeiro - RJ' },
    { id_fornecedor: 3, nome_empresa: 'InfoMega', contato: 'Ricardo Souza', telefone: '(31) 95555-4444', email: 'ricardo@infomega.br', endereco: 'Praça da Tecnologia, 789, Belo Horizonte - MG' },
];

let proximoId = 4;

const Fornecedor = {
    findAll: () => {
        return [...fornecedores]; // Retorna uma cópia para segurança
    },
    
    findById: (id) => {
        return fornecedores.find(f => f.id_fornecedor === parseInt(id));
    },

    create: (dadosFornecedor) => {
        const novoFornecedor = {
            id_fornecedor: proximoId++,
            ...dadosFornecedor
        };
        fornecedores.push(novoFornecedor);
        console.log("Novo fornecedor adicionado:", novoFornecedor);
        return novoFornecedor;
    },

    updateById: (id, dadosFornecedor) => {
        const index = fornecedores.findIndex(f => f.id_fornecedor === parseInt(id));
        if (index === -1) return null;

        const fornecedorAtualizado = { ...fornecedores[index], ...dadosFornecedor };
        fornecedores[index] = fornecedorAtualizado;
        console.log("Fornecedor atualizado:", fornecedorAtualizado);
        return fornecedorAtualizado;
    },

    deleteById: (id) => {
        const index = fornecedores.findIndex(f => f.id_fornecedor === parseInt(id));
        if (index === -1) return null;
        
        const [fornecedorRemovido] = fornecedores.splice(index, 1);
        console.log("Fornecedor removido:", fornecedorRemovido);
        return fornecedorRemovido;
    }
};

module.exports = Fornecedor;