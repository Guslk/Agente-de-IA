// controllers/movimentacaoController.js

const Movimentacao = require('../models/Movimentacao');

const movimentacaoController = {
    getAllMovimentacoes: (req, res) => {
        const movimentacoes = Movimentacao.findAll();

        res.render('movimentacoes', {
            movimentacoes: movimentacoes,
            paginaAtiva: 'movimentacoes' // Para o menu saber qual link marcar como ativo
        });
    }
};

module.exports = movimentacaoController;