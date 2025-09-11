
const Movimentacao = require('../models/Movimentacao');

const movimentacaoController = {
    getAllMovimentacoes: (req, res) => {
        const movimentacoes = Movimentacao.findAll();

        res.render('movimentacoes', {
            movimentacoes: movimentacoes,
            paginaAtiva: 'movimentacoes' 
        });
    }
};

module.exports = movimentacaoController;