// models/Movimentacao.js

const movimentacoes = [
    { id: 1, data: '2025-10-08T10:00:00', itemNome: 'Serra Circular Makita (Exemplo)', tipo: 'Saída', quantidade: 1, responsavel: 'Maria Oliveira', detalhe: 'Baixa de material' },
    { id: 2, data: '2025-10-07T14:30:00', itemNome: 'Furadeira de Impacto (Exemplo)', tipo: 'Entrada', quantidade: 5, responsavel: 'Sistema', detalhe: 'NF: 12345' },
];

let proximoId = 3;

const Movimentacao = {
    findAll: () => {
        return movimentacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
    },

    registrarEntrada: (item, dadosEntrada) => {
        const novoRegistro = {
            id: proximoId++,
            data: new Date().toISOString(),
            itemNome: item.nome,
            tipo: 'Entrada',
            quantidade: parseInt(dadosEntrada.quantidade) || 0,
            responsavel: dadosEntrada.responsavel || 'Sistema',
            detalhe: `NF: ${dadosEntrada.nota_fiscal_codigo || 'N/A'}`
        };
        movimentacoes.push(novoRegistro);
        console.log(">>>> NOVA ENTRADA REGISTRADA NO LOG:", novoRegistro);
    },

    registrarSaida: (item, quantidade, responsavel) => {
        const novoRegistro = {
            id: proximoId++,
            data: new Date().toISOString(),
            itemNome: item.nome,
            tipo: 'Saída',
            quantidade: parseInt(quantidade),
            responsavel: responsavel,
            detalhe: 'Baixa de material'
        };
        movimentacoes.push(novoRegistro);
        console.log(">>>> NOVA SAÍDA REGISTRADA NO LOG:", novoRegistro);
    }
};

module.exports = Movimentacao;