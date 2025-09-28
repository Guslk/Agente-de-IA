const Item = require('../models/Item');

const itemController = {
    getAllItems: (req, res) => {
        try {
            const items = Item.findAll();
            res.render('itens', { 
                items: items,
                paginaAtiva: 'itens'
            });
        } catch (error) {
            console.error("Erro no itemController:", error);
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
    }
};

module.exports = itemController;