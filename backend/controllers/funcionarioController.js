// controllers/funcionarioController.js

const Funcionario = require('../models/Funcionario');

const funcionarioController = {
    getAllFuncionarios: (req, res) => {
        try {
            const todosFuncionarios = Funcionario.findAll();
            const currentUser = Funcionario.findByEmail(req.session.user.email);
            res.render('funcionarios', { 
                funcionarios: todosFuncionarios,
                currentUser: currentUser,
                paginaAtiva: 'funcionarios',
                user: req.session.user
            });
        } catch (error) {
            res.status(500).send("Erro ao buscar funcionários.");
        }
    },

    createFuncionario: (req, res) => {
        try {
            Funcionario.create(req.body);
            res.redirect('/funcionarios');
        } catch (error) {
            res.status(500).send("Erro ao criar funcionário.");
        }
    },

    updateFuncionario: (req, res) => {
        try {
            const { id } = req.params;
            Funcionario.updateById(id, req.body);
            res.redirect('/funcionarios');
        } catch (error) {
            res.status(500).send("Erro ao atualizar funcionário.");
        }
    },

    deleteFuncionario: (req, res) => {
        try {
            const { id } = req.params;
            Funcionario.deleteById(id);
            res.redirect('/funcionarios');
        } catch (error) {
            res.status(500).send("Erro ao excluir funcionário.");
        }
    }
};

module.exports = funcionarioController;