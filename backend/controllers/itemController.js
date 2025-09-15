// controllers/itemController.js

const Item = require('../models/Item');

const itemController = {
    getAllItems: (req, res) => {
        const items = Item.findAll();
        res.render('itens', { 
            items: items,
            paginaAtiva: 'itens'
        });
    },
};

module.exports = itemController;