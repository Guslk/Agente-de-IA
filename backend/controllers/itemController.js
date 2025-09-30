// controllers/itemController.js

// CORREÇÃO 1: Importar com 'I' maiúsculo para manter o padrão
const Item = require('../models/item');

const itemController = {
    getAllItems: (req, res) => {    
        try {
            const items = Item.findAll();
            res.render('itens', { 
                items: items,
                paginaAtiva: 'itens'
            });
        } catch (error) {
            console.error("Erro ao buscar itens:", error);
            res.status(500).send("Ocorreu um erro ao buscar os itens.");
        }
    },

    createItem: (req, res) => {
        try {
            Item.create(req.body);
            res.redirect('/itens');
        } catch (error) {
            console.error("Erro ao criar item:", error);
            res.status(500).send("Ocorreu um erro ao criar o item.");
        }
    },

    updateItem: (req, res) => {
        try {
            const { id } = req.params;
            Item.updateById(id, req.body);
            res.redirect('/itens');
        } catch (error) {
            console.error("Erro ao atualizar item:", error);
            res.status(500).send("Ocorreu um erro ao atualizar o item.");
        }
    },

    deleteItem: (req, res) => {
        try {
            const { id } = req.params;
            Item.deleteById(id);
            res.redirect('/itens');
        } catch (error) {
            console.error("Erro ao deletar item:", error);
            res.status(500).send("Ocorreu um erro ao deletar o item.");
        }
    }, // << CORREÇÃO 2: A vírgula separa esta função da próxima

    // A função 'registrarSaida' agora está DENTRO do objeto
    registrarSaida: (req, res) => {
        try {   
            const { id } = req.params;
            Item.darSaida(id, req.body);
            res.redirect('/itens');
        } catch (error) {
            console.error("Erro ao registrar saída de item:", error);
            res.status(500).send("Ocorreu um erro ao registrar a saída.");
        }
    }
}; // << CORREÇÃO 3: O objeto fecha aqui, no final

module.exports = itemController;