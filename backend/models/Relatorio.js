
// Vamos usar os mesmos dados mockados para simular os cálculos
const items = [
    { id_item: 1, nome: 'SSD NVMe 256GB', quantidade_atual: 52, quantidade_minima: 20 },
    { id_item: 2, nome: 'Memória RAM DDR4 8GB', quantidade_atual: 14, quantidade_minima: 15 },
    { id_item: 3, nome: 'Mouse Gamer Logitech G203', quantidade_atual: 35, quantidade_minima: 10 },
    { id_item: 4, nome: 'Teclado Dell KB216', quantidade_atual: 0, quantidade_minima: 5 },
];

const Relatorio = {
    // Função que calcula os principais indicadores (KPIs)
    getKPIs: () => {
        const totalItemsUnicos = items.length;
        const itensEstoqueBaixo = items.filter(item => item.quantidade_atual > 0 && item.quantidade_atual < item.quantidade_minima).length;
        const itensEsgotados = items.filter(item => item.quantidade_atual === 0).length;

        // Retorna um objeto com os dados calculados
        return {
            totalItemsUnicos,
            itensEstoqueBaixo,
            itensEsgotados,
            valorTotalEstoque: "R$ 15.750,00" // Valor simulado
        };
    },

    // Função que prepara dados para um gráfico de movimentações
    getMovimentacoesChartData: () => {
        // Em um caso real, você buscaria no banco e agruparia por mês
        // Aqui, vamos apenas simular o resultado
        return {
            labels: ['Junho', 'Julho', 'Agosto', 'Setembro'],
            entradas: [55, 60, 75, 90],
            saidas: [40, 50, 60, 72]
        };
    }
};

module.exports = Relatorio;