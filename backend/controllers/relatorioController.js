
const Relatorio = require('../models/Relatorio');

const relatorioController = {
    showRelatorios: (req, res) => {

        const kpis = Relatorio.getKPIs();
        const chartData = Relatorio.getMovimentacoesChartData();


        res.render('relatorios', {
            kpis: kpis,
            chartData: chartData,
            paginaAtiva: 'relatorios'
        });
    }
};

module.exports = relatorioController;