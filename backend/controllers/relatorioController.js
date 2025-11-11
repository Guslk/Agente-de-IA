// controllers/relatorioController.js

const { getTenantDB } = require('../config/database'); 
const db = require('../models');
const { Op, Sequelize } = require('sequelize');

/**
 * Função auxiliar para formatar os dados da Curva ABC para o Chart.js
 */
function formatarCurvaABC(items) {
// ... (código existente... não necessita de alteração)
    if (!items || items.length === 0) {
        return { labels: [], dataValor: [], dataAcumulado: [] };
    }

    const labels = [];
    const dataValor = [];
    const dataAcumulado = [];
    
    // Calcula o valor total (dos itens retornados)
    const grandTotal = items.reduce((sum, item) => sum + parseFloat(item.valorItem || 0), 0);
    if (grandTotal === 0) {
         return { labels: items.map(i => i.name), dataValor: items.map(i => 0), dataAcumulado: items.map(i => 0) };
    }

    let cumulativeValue = 0;
    for (const item of items) {
        labels.push(item.name);
        dataValor.push(item.valorItem || 0);
        
        cumulativeValue += parseFloat(item.valorItem || 0);
        dataAcumulado.push((cumulativeValue / grandTotal) * 100);
    }
    
    return { labels, dataValor, dataAcumulado };
}


const relatorioController = {
    
    showRelatorios: async (req, res) => {
        const { tenantId } = req;
        try {
            // 1. Inicializar a conexão e os modelos para este tenant
            const sequelize = await getTenantDB(tenantId);
            // Modelos corretos baseados nos seus ficheiros
            const { Item, Stock, Output } = db.initialize(sequelize);

            // Verificação de segurança
            if (!Item || !Stock || !Output) {
                throw new Error("Modelos essenciais (Item, Stock, Output) não foram inicializados. Verifique models/index.js e os ficheiros de modelo.");
            }

            // 2. Executar todos os cálculos em paralelo
            const [
                totalValue,
                itemCounts,
                itensPorDepto,
                valorPorDepto,
                itensABC,
                itensParados
            ] = await Promise.all([
                // KPI: Valor Total do Estoque
                // CORREÇÃO: Usa a propriedade 'totalValue' (modelo)
                Item.sum('totalValue', { where: { status: 'Ativo' } }),
                
                // KPIs: Contagens (SKUs, Baixo, Esgotado)
                Item.findAll({
                    where: { status: 'Ativo' },
                    attributes: [
                        // CORREÇÃO: Usa 'id_item' (coluna real do BD)
                        [Sequelize.fn('COUNT', Sequelize.col('id_item')), 'totalItemsUnicos'],
                        [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN quantity <= 0 THEN 1 ELSE 0 END")), 'itensEsgotados'],
                        // CORREÇÃO: Usa 'minimum_quantity' (coluna real do BD)
                        [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN quantity > 0 AND quantity < `minimum_quantity` THEN 1 ELSE 0 END")), 'itensEstoqueBaixo']
                    ],
                    raw: true
                }),

                // Gráfico 1: Itens por Departamento (Rosca)
                Item.findAll({
                    where: { status: 'Ativo' },
                    include: [{ 
                        model: Stock, 
                        as: 'stock', // 'as: stock' está CORRETO
                        attributes: [] 
                    }],
                     // CORREÇÃO: Agrupa pelas colunas reais do BD
                    group: ['stock.id_stock', 'stock.name_stock'],
                    attributes: [
                        // CORREÇÃO: Usa 'id_item' (coluna real do BD)
                        [Sequelize.fn('COUNT', Sequelize.col('Item.id_item')), 'count'],
                        // CORREÇÃO: Usa 'name_stock' (coluna real do BD)
                        [Sequelize.col('stock.name_stock'), 'stockName'] 
                    ],
                    raw: true
                }),
                
                // Gráfico 2: Valor por Departamento (Barras)
                Item.findAll({
                    where: { status: 'Ativo' },
                    include: [{ 
                        model: Stock, 
                        as: 'stock', // 'as: stock' (CORRETO)
                        attributes: []
                    }],
                    // CORREÇÃO: Agrupa pelas colunas reais do BD
                    group: ['stock.id_stock', 'stock.name_stock'],
                    attributes: [
                        // CORREÇÃO: Usa 'total_value' (coluna real do BD)
                        [Sequelize.fn('SUM', Sequelize.col('total_value')), 'totalValorDepto'],
                        [Sequelize.col('stock.name_stock'), 'stockName']
                    ],
                    order: [[Sequelize.literal('`totalValorDepto`'), 'DESC']],
                    raw: true
                }),

                // Gráfico 3: Curva ABC (Top 20 Itens por Valor)
                Item.findAll({
                    where: { status: 'Ativo', quantity: { [Op.gt]: 0 } },
                    attributes: [
                        'name',
                        // CORREÇÃO: Usa 'total_value' (coluna real do BD)
                        [Sequelize.col('total_value'), 'valorItem'] 
                    ],
                    order: [[Sequelize.literal('`valorItem`'), 'DESC']],
                    limit: 20, 
                    raw: true
                }),

                // Tabela 4: Itens Parados (Sem SAÍDA há 90 dias)
                Item.findAll({
                    where: { status: 'Ativo', quantity: { [Op.gt]: 0 } },
                    attributes: [
                        // CORREÇÃO: Mapeia colunas reais para propriedades
                        ['id_item', 'id'], // O modelo 'Item' usa 'id', mas a coluna é 'id_item'
                        'name', 
                        'code', 
                        'quantity',
                        ['total_value', 'totalValue'], // Mapeia coluna 'total_value' para 'totalValue'
                        // CORREÇÃO: Usa 'outputs.exit_date' (coluna real do BD)
                        [Sequelize.fn('MAX', Sequelize.col('outputs.exit_date')), 'ultimaSaida']
                    ],
                    include: [{
                        model: Output,
                        as: 'outputs', // <-- CORRETO: 'outputs'
                        attributes: [], 
                        required: false // LEFT JOIN
                    }],
                    // CORREÇÃO: Agrupa por todas as colunas reais do BD
                    group: ['Item.id_item', 'Item.name', 'Item.code', 'Item.quantity', 'Item.total_value'], 
                    // CORREÇÃO: Usa backticks (`) e CURDATE() para MySQL
                    having: Sequelize.literal("`ultimaSaida` IS NULL OR `ultimaSaida` < (CURDATE() - INTERVAL 90 DAY)"),
                    order: [[Sequelize.literal('`totalValue`'), 'DESC']],
                    raw: true
                })
            ]);

            // 3. Formatar os dados para a View
            const counts = itemCounts[0] || {};
            const kpis = {
                valorTotalEstoque: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue || 0),
                totalItemsUnicos: counts.totalItemsUnicos || 0,
                itensEstoqueBaixo: counts.itensEstoqueBaixo || 0,
                itensEsgotados: counts.itensEsgotados || 0,
                
                itensParados: itensParados, 
                
                // Formatar para Chart.js
                // CORREÇÃO: usa 'stockName' que buscamos na consulta
                itensPorCategoria: {
                    labels: itensPorDepto.map(d => d.stockName),
                    data: itensPorDepto.map(d => d.count)
                },
                valorPorCategoria: {
                    labels: valorPorDepto.map(d => d.stockName),
                    data: valorPorDepto.map(d => d.totalValorDepto) 
                },
                curvaABC: formatarCurvaABC(itensABC)
            };

            // 4. Renderizar a página com os dados
            res.render('relatorios', {
                kpis: kpis,
                user: req.session.user,
                paginaAtiva: 'relatorios'
            });

        } catch (error) {
            console.error("Erro ao gerar relatórios:", error);
            if (error.message.includes("Include unexpected")) {
                 console.error("DICA: Verifique se as associações (as: '...') no controlador correspondem aos seus ficheiros de modelo.");
                 res.status(500).send("Erro ao gerar relatórios: Falha na associação de modelos.");
            } else {
                res.status(500).send(`Erro ao gerar relatórios: ${error.message}`);
            }
        }
    }
};

module.exports = relatorioController;