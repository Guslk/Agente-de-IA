// controllers/itemController.js

// 1. Importa o Model para que o Controller possa usá-lo
const Item = require('../models/item');

const itemController = {
    // Função que será chamada para renderizar a página de itens
    getAllItems: (req, res) => {
        // 2. Usa o Model para buscar os dados
        const items = Item.findAll();

        // 3. Renderiza a View, passando os dados para ela
        // O primeiro argumento 'itens' é o nome do arquivo (views/itens.ejs)
        // O segundo argumento é um objeto onde passamos os dados que a view vai usar
        res.render('itens', { items: items });
    },

    // No futuro, você teria outras funções aqui:
    // getItemById: (req, res) => { ... },
    // createItem: (req, res) => { ... },
};

module.exports = itemController;