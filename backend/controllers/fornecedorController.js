// controllers/fornecedorController.js

const Fornecedor = require('../models/Fornecedor');

const fornecedorController = {
    getAllFornecedores: (req, res) => {
        try {
            const todosFornecedores = Fornecedor.findAll();
            res.render('fornecedores', {
                fornecedores: todosFornecedores,
                paginaAtiva: 'fornecedores',
                user: req.session.user
            });
        } catch (error) {
            res.status(500).send("Erro ao buscar fornecedores.");
        }
    },

    createFornecedor: (req, res) => {
        try {
            Fornecedor.create(req.body);
            res.redirect('/fornecedores');
        } catch (error) {
            res.status(500).send("Erro ao criar fornecedor.");
        }
    },

    updateFornecedor: (req, res) => {
        try {
            const { id } = req.params;
            Fornecedor.updateById(id, req.body);
            res.redirect('/fornecedores');
        } catch (error) {
            res.status(500).send("Erro ao atualizar fornecedor.");
        }
    },

    deleteFornecedor: (req, res) => {
        try {
            const { id } = req.params;
            Fornecedor.deleteById(id);
            res.redirect('/fornecedores');
        } catch (error) {
            res.status(500).send("Erro ao excluir fornecedor.");
        }
    }
};

module.exports = fornecedorController;