// controllers/itemController.js

// CORREÇÃO 1: Importar com 'I' maiúsculo para manter o padrão
const Item = require('../models/item');

const itemController = {
    getAllItems: (req, res) => {
        try {
            // 1. Pega os parâmetros da URL (ex: /itens?busca=ssd&filtroStatus=todos)
            const { busca, filtroStatus } = req.query;

            // 2. Passa os filtros para o Model
            const items = Item.findAll({ busca, filtroStatus });
            
            // 3. Renderiza a view, passando a lista filtrada e também os termos da busca
            //    para que os campos do formulário permaneçam preenchidos.
            res.render('itens', { 
                items: items,
                paginaAtiva: 'itens',
                busca: busca || '',
                filtroStatus: filtroStatus || 'todos'
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