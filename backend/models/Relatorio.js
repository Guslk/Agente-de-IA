// models/Relatorio.js

const Item = require('./item'); // Importamos o model de Itens para usar seus dados

const Relatorio = {
    // Função que calcula os principais indicadores (KPIs)
    getKPIs: () => {
        const todosItens = Item.findAll();

        const totalItemsUnicos = todosItens.length;
        const itensEstoqueBaixo = todosItens.filter(item => item.quantidade_atual > 0 && item.quantidade_atual < item.quantidade_minima).length;
        const itensEsgotados = todosItens.filter(item => item.quantidade_atual === 0).length;
        
        // Calcula o valor total do estoque (preço x quantidade)
        const valorTotalEstoque = todosItens.reduce((total, item) => {
            return total + (item.preco_unitario * item.quantidade_atual);
        }, 0);

        return {
            totalItemsUnicos,
            itensEstoqueBaixo,
            itensEsgotados,
            valorTotalEstoque: valorTotalEstoque.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        };
    },

    // Função que agrupa os itens por categoria para o gráfico
    getItensPorCategoria: () => {
        const todosItens = Item.findAll();
        const contagem = {};

        // Conta quantos itens existem em cada categoria
        todosItens.forEach(item => {
            contagem[item.categoria] = (contagem[item.categoria] || 0) + 1;
        });
        
        // Formata os dados para o padrão que o Chart.js espera
        return {
            labels: Object.keys(contagem), // Ex: ['Hardware', 'Periféricos', 'Monitores']
            data: Object.values(contagem)   // Ex: [2, 2, 1]
        };
    }
};

module.exports = Relatorio;