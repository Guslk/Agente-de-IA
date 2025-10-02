// controllers/movimentacaoController.js

const Movimentacao = require('../models/Movimentacao');

const movimentacaoController = {
    getAllMovimentacoes: (req, res) => {
        const todasMovimentacoes = Movimentacao.findAll();

        res.render('movimentacoes', {
            movimentacoes: todasMovimentacoes,
            paginaAtiva: 'movimentacoes'
        });
    }
};

module.exports = movimentacaoController;