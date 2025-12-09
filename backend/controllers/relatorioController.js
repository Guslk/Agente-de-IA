// controllers/relatorioController.js

const { getTenantDB } = require('../config/database'); 
const db = require('../models');
const { Op, Sequelize } = require('sequelize');

/**
 * Função auxiliar para formatar os dados da Curva ABC
 */
function formatarCurvaABC(items) {
    if (!items || items.length === 0) {
        return { labels: [], dataValor: [], dataAcumulado: [] };
    }

    const labels = [];
    const dataValor = [];
    const dataAcumulado = [];
    
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

/**
 * Processa Entradas e Saídas separadamente e unifica no gráfico
 */
function processarFluxoFinanceiro(entries, outputs) {
    const grouped = {};
    const labels = [];
    const entradasData = [];
    const saidasData = [];

    // Helper para agrupar por mês
    const processarRegistro = (item, dateField, type) => {
        if (!item[dateField]) return;
        
        const dateObj = new Date(item[dateField]);
        const monthYear = dateObj.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        const sortKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

        if (!grouped[sortKey]) {
            grouped[sortKey] = { label: monthYear, entrada: 0, saida: 0 };
        }

        // Calcula o valor total da movimentação
        const totalValue = parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0);

        if (type === 'entrada') {
            grouped[sortKey].entrada += totalValue;
        } else {
            grouped[sortKey].saida += totalValue;
        }
    };

    // 1. Processa todas as Entradas
    entries.forEach(e => processarRegistro(e, 'entryDate', 'entrada'));
    
    // 2. Processa todas as Saídas
    outputs.forEach(o => processarRegistro(o, 'exitDate', 'saida'));

    // 3. Ordena e prepara arrays finais
    Object.keys(grouped).sort().forEach(key => {
        labels.push(grouped[key].label.toUpperCase());
        entradasData.push(grouped[key].entrada.toFixed(2));
        saidasData.push(grouped[key].saida.toFixed(2));
    });

    return { labels, entradas: entradasData, saidas: saidasData };
}

/**
 * Processa Risco de Ruptura (Days of Coverage)
 * Filtra itens que têm menos de 15 dias de cobertura.
 */
function processarRiscoRuptura(items, consumptionRates) {
    const rateMap = new Map();
    // Consumo bruto dos últimos 30 dias, mapeado pelo Item ID
    consumptionRates.forEach(r => rateMap.set(r.itemId, parseFloat(r.totalConsumed)));

    const days = 30; // Período de análise (últimos 30 dias)
    const limiteRisco = 15; // Alerta para menos de 15 dias de cobertura

    return items
        .map(item => {
            const totalConsumed = rateMap.get(item.id) || 0;
            
            // Consumo médio diário (CMD)
            const consumptionRate = totalConsumed / days;

            // Dias de Cobertura (Dias do estoque atual ao ritmo de consumo)
            const daysOfCoverage = consumptionRate > 0 
                                 ? (parseFloat(item.quantity) / consumptionRate) 
                                 : Infinity; // Se não houver consumo, dura para sempre

            return {
                ...item,
                consumptionRate: consumptionRate.toFixed(2),
                daysOfCoverage: Math.floor(daysOfCoverage)
            };
        })
        .filter(item => item.daysOfCoverage < limiteRisco)
        .sort((a, b) => a.daysOfCoverage - b.daysOfCoverage); // Ordena pelo risco mais alto (menores dias)
}


const relatorioController = {
    
    showRelatorios: async (req, res) => {
        const { tenantId } = req;
        try {
            const sequelize = await getTenantDB(tenantId);
            
            // CORREÇÃO: Carregamos Entry e Output, Item e Stock
            const { Item, Stock, Output, Entry } = db.initialize(sequelize);

            if (!Item || !Stock || !Output || !Entry) {
                throw new Error("Modelos essenciais não inicializados. Verifique se Entry e Output existem em models/.");
            }

            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            const oneMonthAgo = new Date(); // Para o cálculo de Risco (30 dias)
            oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);


            // 2. Executar consultas em paralelo
            const [
                totalValue,
                itemCounts,
                itensPorDepto,
                valorPorDepto,
                itensABC,
                itensParados,
                rawEntries,
                rawOutputs
            ] = await Promise.all([
                // 1. Valor Total
                Item.sum('totalValue', { where: { status: 'Ativo' } }),
                
                // 2. Contagens (KPIs)
                Item.findAll({
                    where: { status: 'Ativo' },
                    attributes: [
                        [Sequelize.fn('COUNT', Sequelize.col('id_item')), 'totalItemsUnicos'],
                        [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN quantity <= 0 THEN 1 ELSE 0 END")), 'itensEsgotados'],
                        [Sequelize.fn('SUM', Sequelize.literal("CASE WHEN quantity > 0 AND quantity < `minimum_quantity` THEN 1 ELSE 0 END")), 'itensEstoqueBaixo']
                    ],
                    raw: true
                }),

                // 3. Itens por Depto
                Item.findAll({
                    where: { status: 'Ativo' },
                    include: [{ model: Stock, as: 'stock', attributes: [] }],
                    group: ['stock.id_stock', 'stock.name_stock'],
                    attributes: [
                        [Sequelize.fn('COUNT', Sequelize.col('Item.id_item')), 'count'],
                        [Sequelize.col('stock.name_stock'), 'stockName'] 
                    ],
                    raw: true
                }),
                
                // 4. Valor por Depto
                Item.findAll({
                    where: { status: 'Ativo' },
                    include: [{ model: Stock, as: 'stock', attributes: [] }],
                    group: ['stock.id_stock', 'stock.name_stock'],
                    attributes: [
                        [Sequelize.fn('SUM', Sequelize.col('total_value')), 'totalValorDepto'],
                        [Sequelize.col('stock.name_stock'), 'stockName']
                    ],
                    order: [[Sequelize.literal('`totalValorDepto`'), 'DESC']],
                    raw: true
                }),

                // 5. Curva ABC
                Item.findAll({
                    where: { status: 'Ativo', quantity: { [Op.gt]: 0 } },
                    attributes: ['name', [Sequelize.col('total_value'), 'valorItem']],
                    order: [[Sequelize.literal('`valorItem`'), 'DESC']],
                    limit: 20, 
                    raw: true
                }),

                // 6. Itens Parados
                Item.findAll({
                    where: { status: 'Ativo', quantity: { [Op.gt]: 0 } },
                    attributes: [
                        ['id_item', 'id'], 'name', 'code', 'quantity', ['total_value', 'totalValue'],
                        [Sequelize.fn('MAX', Sequelize.col('outputs.exit_date')), 'ultimaSaida']
                    ],
                    include: [{ model: Output, as: 'outputs', attributes: [], required: false }],
                    group: ['Item.id_item', 'Item.name', 'Item.code', 'Item.quantity', 'Item.total_value'], 
                    having: Sequelize.literal("`ultimaSaida` IS NULL OR `ultimaSaida` < (CURDATE() - INTERVAL 90 DAY)"),
                    order: [[Sequelize.literal('`totalValue`'), 'DESC']],
                    raw: true
                }),

                // 7. BUSCAR ENTRADAS (Financeiro, 6 meses)
                Entry.findAll({
                    where: { entryDate: { [Op.gte]: sixMonthsAgo } },
                    attributes: ['entryDate', 'quantity', 'unitPrice'],
                    raw: true
                }),

                // 8. BUSCAR SAÍDAS (Financeiro, 6 meses)
                Output.findAll({
                    where: { exitDate: { [Op.gte]: sixMonthsAgo } },
                    attributes: ['exitDate',[Sequelize.col('quantify'), 'quantity'], 
        'unitPrice'
    ],
                    raw: true
                })
            ]);

            // --- CÁLCULO DE RISCO DE RUPTURA (30 dias) ---
            const [rawConsumptionRatesForRisk, allActiveItemsForRisk] = await Promise.all([
                // 9. BUSCAR CONSUMO BRUTO DOS ÚLTIMOS 30 DIAS
                Output.findAll({
                    where: { exitDate: { [Op.gte]: oneMonthAgo } },
                    attributes: [
                        'itemId',
                        [Sequelize.fn('SUM', Sequelize.col('quantify')), 'totalConsumed']
                    ],
                    group: ['itemId'],
                    raw: true
                }),
                // 10. BUSCAR ITENS ATIVOS PARA MERGE COM TAXA DE CONSUMO
                Item.findAll({ 
                    where: { status: 'Ativo', quantity: { [Op.gt]: 0 } },
                    attributes: ['id', 'name', 'code', 'quantity', 'minimumQuantity', 'unitOfMeasure'],
                    raw: true
                })
            ]);
            // --- FIM DO CÁLCULO DE RISCO DE RUPTURA ---


            // 3. Formatar os dados para a View
            const counts = itemCounts[0] || {};
            
            // Processa o gráfico financeiro
            const financeiroData = processarFluxoFinanceiro(rawEntries, rawOutputs);
            
            // Processa o risco
            const riscoRuptura = processarRiscoRuptura(allActiveItemsForRisk, rawConsumptionRatesForRisk);


            const kpis = {
                valorTotalEstoque: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue || 0),
                totalItemsUnicos: counts.totalItemsUnicos || 0,
                itensEstoqueBaixo: counts.itensEstoqueBaixo || 0,
                itensEsgotados: counts.itensEsgotados || 0,
                itensParados: itensParados, 
                itensPorCategoria: {
                    labels: itensPorDepto.map(d => d.stockName),
                    data: itensPorDepto.map(d => d.count)
                },
                valorPorCategoria: {
                    labels: valorPorDepto.map(d => d.stockName),
                    data: valorPorDepto.map(d => d.totalValorDepto) 
                },
                curvaABC: formatarCurvaABC(itensABC),
                riscoRuptura: riscoRuptura // <--- NOVO DADO ENVIADO
            };

            res.render('relatorios', {
                kpis: kpis,
                chartData: financeiroData,
                user: req.session.user,
                paginaAtiva: 'relatorios'
            });

        } catch (error) {
            console.error("Erro ao gerar relatórios:", error);
            res.status(500).send(`Erro ao gerar relatórios: ${error.message}`);
        }
    }
};

module.exports = relatorioController;