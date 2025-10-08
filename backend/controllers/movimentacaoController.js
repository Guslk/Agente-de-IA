// controllers/movimentacaoController.js

const Movimentacao = require('../models/Movimentacao');
const Item = require('../models/Item');
const Funcionario = require('../models/Funcionario'); // << 1. IMPORTAR O MODEL DE FUNCIONÁRIO

const movimentacaoController = {
    getAllMovimentacoes: (req, res) => {
        try {
            const todasMovimentacoes = Movimentacao.findAll();
            const todosItens = Item.findAll();
            const todosFuncionarios = Funcionario.findAll(); // << 2. BUSCAR TODOS OS FUNCIONÁRIOS

            res.render('movimentacoes', {
                movimentacoes: todasMovimentacoes,
                items: todosItens,
                funcionarios: todosFuncionarios, // << 3. ENVIAR A LISTA PARA A VIEW
                paginaAtiva: 'movimentacoes',
                user: req.session.user
            });
        } catch (error) {
            console.error("Erro ao buscar movimentações:", error);
            res.status(500).send("Erro ao carregar a página de movimentações.");
        }
    },

    registrarEntrada: (req, res) => {
        try {
            const { itemId } = req.body;
            Item.darEntrada(itemId, req.body);
            res.redirect('/movimentacoes');
        } catch (error) {
            console.error("Erro ao registrar entrada:", error);
            res.status(500).send("Erro ao registrar entrada.");
        }
    },

    registrarSaida: (req, res) => {
        try {
            const { itemId } = req.body;
            Item.darSaida(itemId, req.body);
            res.redirect('/movimentacoes');
        } catch (error) {
            console.error("Erro ao registrar saída:", error);
            res.status(500).send("Erro ao registrar saída.");
        }
    }
};

module.exports = movimentacaoController;