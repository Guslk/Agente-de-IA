// controllers/relatorioController.js

const Relatorio = require('../models/Relatorio');

const relatorioController = {
    showRelatorios: (req, res) => {
        try {
            // Busca os dados dos KPIs
            const kpis = Relatorio.getKPIs();
            
            // Busca os dados formatados para o gráfico de categorias
            const itensPorCategoriaData = Relatorio.getItensPorCategoria();

            // Renderiza a view, passando TODAS as variáveis necessárias
            res.render('relatorios', {
                kpis: kpis,
                itensPorCategoriaData: itensPorCategoriaData, // <-- Variável que estava faltando
                user: req.session.user,
                paginaAtiva: 'relatorios'
            });
        } catch (error) {
            console.error("Erro ao gerar relatórios:", error);
            res.status(500).send("Erro ao gerar relatórios.");
        }
    }
};

module.exports = relatorioController;