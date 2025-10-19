// controllers/movementController.js (em inglês)
const { getTenantDB } = require('../config/database');
const db = require('../models');

const movementController = {
    getAll: async (req, res) => {
        const { tenantId } = req;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Entry, Output, Item, Supplier, Employee } = db.initialize(sequelize);

            const entries = await Entry.findAll({ include: [{ model: Item, as: 'item', attributes: ['name'] }], raw: true, nest: true });
            const outputs = await Output.findAll({ include: [{ model: Item, as: 'item', attributes: ['name'] }], raw: true, nest: true });

            const allMovements = [
                ...entries.map(e => ({ type: 'Entrada', date: e.entryDate, quantity: e.quantity, item: e.item.name, details: `NF: ${e.invoiceNumber}` })),
                ...outputs.map(o => ({ type: 'Saída', date: o.exitDate, quantity: -Math.abs(o.quantity), item: o.item.name, details: o.justification || `OS: ${o.productionOrder}` }))
            ];
            allMovements.sort((a, b) => new Date(b.date) - new Date(a.date));

            const items = await Item.findAll({ order: [['name', 'ASC']] });
            const suppliers = await Supplier.findAll({ order: [['name', 'ASC']] });
            const employees = await Employee.findAll({ order: [['name', 'ASC']] });

            res.render('movimentacoes', { movements: allMovements, items, suppliers, employees, user: req.session.user });
        } catch (error) {
            console.error("Error fetching data:", error);
            res.status(500).send(`Error: ${error.message}`);
        }
    },

    createEntry: async (req, res) => {
        const { tenantId } = req;
        const { itemId, quantity, supplierId, invoiceNumber } = req.body;
        let transaction;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, Entry } = db.initialize(sequelize);
            transaction = await sequelize.transaction();

            const item = await Item.findByPk(itemId, { transaction, lock: true });
            if (!item) throw new Error('Item not found.');
            
            await item.increment('quantity', { by: quantity, transaction });

            await Entry.create({ entryDate: new Date(), invoiceNumber, quantity, supplierId, itemId }, { transaction });

            await transaction.commit();
            res.redirect('/movimentacoes');
        } catch (error) {
            if (transaction) await transaction.rollback();
            res.status(500).send(`Error creating entry: ${error.message}`);
        }
    },
    
    createOutput: async (req, res) => {
        const { tenantId } = req;
        const { itemId, quantity, justification, productionOrder } = req.body;
        let transaction;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, Output } = db.initialize(sequelize);
            transaction = await sequelize.transaction();

            const item = await Item.findByPk(itemId, { transaction, lock: true });
            if (!item) throw new Error('Item not found.');

            if (parseFloat(item.quantity) < parseFloat(quantity)) {
                throw new Error('Not enough stock available.');
            }

            await item.decrement('quantity', { by: quantity, transaction });

            await Output.create({ exitDate: new Date(), justification, quantity, productionOrder, itemId }, { transaction });

            await transaction.commit();
            res.redirect('/movimentacoes');
        } catch (error) {
            if (transaction) await transaction.rollback();
            res.status(500).send(`Error creating exit: ${error.message}`);
        }
    }
};

module.exports = movementController;