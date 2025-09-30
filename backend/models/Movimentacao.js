// models/Movimentacao.js

// Simulação do nosso banco de dados de movimentações
const movimentacoes = [
    { id: 1, data: '2025-09-28T10:00:00', itemNome: 'Serra Circular Makita (Exemplo)', tipo: 'Saída', quantidade: 1, responsavel: 'Maria Oliveira' },
    { id: 2, data: '2025-09-27T14:30:00', itemNome: 'Furadeira de Impacto (Exemplo)', tipo: 'Entrada', quantidade: 5, responsavel: 'João da Silva' },
];

let proximoId = 3;

const Movimentacao = {
    findAll: () => {
        // Retorna ordenado do mais recente para o mais antigo
        return movimentacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
    },

    // Função para registrar uma nova entrada de item
    registrarEntrada: (item, dadosFormulario) => {
        const novoRegistro = {
            id: proximoId++,
            data: new Date().toISOString(),
            itemNome: item.nome,
            tipo: 'Entrada',
            quantidade: item.quantidade_atual,
            responsavel: 'Sistema', // Futuramente, pegaremos o nome do usuário logado
            detalhe: `NF: ${dadosFormulario.nota_fiscal_codigo || 'N/A'}`
        };
        movimentacoes.push(novoRegistro);
        console.log("Nova movimentação de ENTRADA registrada:", novoRegistro);
    },
    registrarSaida: (item, quantidade, responsavel) => {
    const novoRegistro = {
        id: proximoId++,
        data: new Date().toISOString(),
        itemNome: item.nome,
        tipo: 'Saída',
        quantidade: quantidade,
        responsavel: responsavel,
        detalhe: 'Baixa de material'
    };
    movimentacoes.push(novoRegistro);
    console.log("Nova movimentação de SAÍDA registrada:", novoRegistro);
}
};


module.exports = Movimentacao;