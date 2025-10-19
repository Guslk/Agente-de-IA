// controllers/stockController.js
const { getTenantDB } = require('../config/database');
const db = require('../models');

const stockController = {
    /**
     * Creates a new Stock (Department).
     */
    create: async (req, res) => {
        const { tenantId } = req;
        const { name } = req.body;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Stock } = db.initialize(sequelize);

            await Stock.create({ name });

            res.redirect('/itens?success=stock_created');
        } catch (error) {
            console.error("Error creating stock:", error);
            res.status(500).send(`Error creating stock: ${error.message}`);
        }
    },


    update: async (req, res) => {
        const { tenantId } = req;
        const { id } = req.params;
        const { name } = req.body;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Stock } = db.initialize(sequelize);

            const stock = await Stock.findByPk(id);
            if (!stock) return res.status(404).send('Stock not found.');

            await stock.update({ name });
            res.redirect('/itens?success=stock_updated');
        } catch (error) {
            console.error("Error updating stock:", error);
            res.status(500).send(`Error updating stock: ${error.message}`);
        }
    },


    destroy: async (req, res) => {
        const { tenantId } = req;
        const { id } = req.params;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Stock } = db.initialize(sequelize);

            const stock = await Stock.findByPk(id);
            if (!stock) {
                return res.status(404).send('Stock not found to delete.');
            }

            // Tenta deletar o estoque
            await stock.destroy();
            
            // Se der certo, redireciona com uma mensagem de sucesso
            res.redirect('/itens?success=stock_deleted');

        } catch (error) {

            // Verifica se o erro é especificamente de chave estrangeira
            if (error.name === 'SequelizeForeignKeyConstraintError') {
                console.warn(`Attempt to delete a stock in use. Stock ID: ${id}`);
                // Se for, redireciona com uma mensagem de erro específica
                return res.redirect('/itens?error=stock_in_use');
            }
            // ======================================================

            // Para qualquer outro tipo de erro, mostra um erro genérico
            console.error("Error deleting stock:", error);
            res.status(500).send(`Error deleting stock: ${error.message}`);
        }
    }
};

module.exports = stockController;