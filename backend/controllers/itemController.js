const Item = require('../models/item');

const itemController = {

    getAllItems: (req, res) => {
        const items = Item.findAll();
        res.render('itens', { items: items });
    },
};

module.exports = itemController;