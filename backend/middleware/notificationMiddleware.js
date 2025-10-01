// middleware/notificationMiddleware.js

const Item = require('../models/item');

const checkNotifications = (req, res, next) => {
    // res.locals é um objeto que passa dados para as views (arquivos .ejs)
    // em qualquer rota que este middleware for usado.
    res.locals.lowStockCount = Item.getLowStockCount();
    
    // next() informa ao Express para continuar para a próxima etapa (a rota principal)
    next();
};

module.exports = checkNotifications;