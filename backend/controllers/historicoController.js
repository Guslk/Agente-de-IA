const Historico = require('../models/Historico');

const historicoController = {
    showHistorico: (req, res) => {
        const historicoCompleto = Historico.findAll();
        res.render('historico', {
            historico: historicoCompleto
            // Não passamos paginaAtiva para não destacar nenhum item do menu
        });
    }
};

module.exports = historicoController;