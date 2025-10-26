// controllers/movementController.js (em inglês)
const { Sequelize, Op } = require('sequelize');
const { getTenantDB } = require('../config/database');
const db = require('../models');

const movementController = {
    getAll: async (req, res) => {
        const { tenantId } = req;
        // 1. Captura filtros E parâmetros de ordenação
        const {
            itemId,
            supplierId,
            movementType,
            details,
            startDate,
            endDate,
            sort,
            order
        } = req.query;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Entry, Output, Item, Supplier, Employee } = db.initialize(sequelize);

            // --- 2. Lógica de Filtro (Where) ---
            const entryWhere = {};
            const outputWhere = {};

            if (itemId && itemId !== "") {
                entryWhere.itemId = itemId;
                outputWhere.itemId = itemId;
            }

            let start, end;
            if (startDate) {
                // Força a data de início para o primeiro segundo do dia em UTC
                start = new Date(startDate + 'T00:00:00.000Z');
            }
            if (endDate) {
                // Força a data de fim para o último segundo do dia em UTC
                end = new Date(endDate + 'T23:59:59.999Z');
            }

            if (start && end) {
                entryWhere.entryDate = { [Op.between]: [start, end] };
                outputWhere.exitDate = { [Op.between]: [start, end] };
            } else if (start) {
                entryWhere.entryDate = { [Op.gte]: start };
                outputWhere.exitDate = { [Op.gte]: start };
            } else if (end) {
                entryWhere.entryDate = { [Op.lte]: end };
                outputWhere.exitDate = { [Op.lte]: end };
            }

            if (supplierId && supplierId !== "") {
                entryWhere.supplierId = supplierId;
            }

            if (details && details !== "") {
                outputWhere[Op.or] = [
                    { justification: { [Op.like]: `%${details}%` } },
                    { productionOrder: { [Op.like]: `%${details}%` } },
                ];
            }

            // --- 3. Busca de Dados ---
            let entries = [];
            let outputs = [];

            const includeItem = [{ model: Item, as: 'item', attributes: ['name', 'code'] }]; // Adicionado 'code' para consistência
            const includeItemAndSupplier = [
                { model: Item, as: 'item', attributes: ['name', 'code'] },
                { model: Supplier, as: 'supplier', attributes: ['name'] }
            ];

            if (!movementType || movementType === "" || movementType === "todos" || movementType === "Entrada") {
                entries = await Entry.findAll({
                    where: entryWhere,
                    include: includeItemAndSupplier
                });
            }
            if (!movementType || movementType === "" || movementType === "todos" || movementType === "Saída") {
                // A consulta 'outputWhere' agora contém o filtro 'details'
                outputs = await Output.findAll({
                    where: outputWhere,
                    include: includeItem
                });
            }

            // 4. Mapeia e Mescla os resultados
            const allMovements = [
                ...entries.map(e => ({
                    type: 'Entrada',
                    date: e.entryDate,
                    quantity: e.quantity,
                    unitPrice: e.unitPrice,
                    item: e.item ? e.item.name : 'Item Deletado',
                    details: e.supplier ? e.supplier.name : `NF: ${e.invoiceNumber}`
                })),
                ...outputs.map(o => ({
                    type: 'Saída',
                    date: o.exitDate,
                    quantity: -Math.abs(o.quantity),
                    unitPrice: -Math.abs(o.unitPrice),
                    item: o.item ? o.item.name : 'Item Deletado',
                    details: o.justification || `OS: ${o.productionOrder}`
                }))
            ];


            // --- 5. Lógica de Ordenação (aplicada no array mesclado) ---
            const sortColumn = sort || 'date';
            const sortOrder = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            allMovements.sort((a, b) => {
                let valA, valB;
                switch (sortColumn) {
                    case 'item': valA = a.item.toLowerCase(); valB = b.item.toLowerCase(); break;
                    case 'quantity': valA = a.quantity; valB = b.quantity; break;
                    case 'type': valA = a.type.toLowerCase(); valB = b.type.toLowerCase(); break;
                    case 'date': default: valA = new Date(a.date); valB = new Date(b.date); break;
                }

                // Esta função .sort() já lida com ASC e DESC corretamente.
                if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
                if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
                return 0;
            });

            // 6. Busca dados para os Filtros e Modais
            const items = await Item.findAll({
                where: { status: 'Ativo' },
                order: [['name', 'ASC']]
            });
            const suppliers = await Supplier.findAll({ order: [['name', 'ASC']] });
            const employees = await Employee.findAll({ order: [['name', 'ASC']] });

            // 7. Renderiza a view com TODOS os dados
            res.render('movimentacoes', {
                movements: allMovements,
                items,
                suppliers,
                employees,
                filters: req.query,
                user: req.session.user,
                paginaAtiva: 'movimentacoes',
                currentSort: { column: sortColumn, order: sortOrder }
            });

        } catch (error) {
            console.error("Error fetching data:", error);
            res.status(500).send(`Error: ${error.message}`);
        }
    },


    createEntry: async (req, res) => {
        const { tenantId } = req;
        // O formulário de entrada agora precisa enviar 'unitPrice'
        const { itemId, quantity, supplierId, invoiceNumber, unitPrice } = req.body;
        let transaction;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, Entry } = db.initialize(sequelize);
            transaction = await sequelize.transaction();

            const item = await Item.findByPk(itemId, { transaction, lock: true });
            if (!item) throw new Error('Item not found.');

            const newEntryValue = parseFloat(quantity) * parseFloat(unitPrice);

            // 1. Incrementa a quantidade
            await item.increment('quantity', { by: quantity, transaction });
            // 2. Incrementa o valor total
            await item.increment('totalValue', { by: newEntryValue, transaction });

            await Entry.create({
                entryDate: new Date(),
                invoiceNumber,
                quantity,
                supplierId,
                itemId,
                unitPrice // Salva o preço de compra desta entrada
            }, { transaction });

            await transaction.commit();
            res.redirect('/movimentacoes');
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.error("Error creating entry:", error);
            res.status(500).send(`Error: ${error.message}`);
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

            const currentQuantity = parseFloat(item.quantity);
            const currentValue = parseFloat(item.totalValue);
            const quantityToExit = parseFloat(quantity);

            // 1. Validação de estoque
            if (currentQuantity < quantityToExit) {
                throw new Error('Not enough stock available.');
            }

            // 2. Cálculo do Custo Médio Ponderado (CMP)
            // Custo Médio = Valor Total / Quantidade Total
            // (Evita divisão por zero se a quantidade for 0)
            const costPerItem = (currentQuantity > 0) ? (currentValue / currentQuantity) : 0;

            // 3. Calcula o valor a ser debitado do estoque
            const valueToExit = costPerItem * quantityToExit;

            // 4. Decrementa a quantidade e o valor total
            await item.decrement('quantity', { by: quantityToExit, transaction });
            await item.decrement('totalValue', { by: valueToExit, transaction });

            // 5. Cria o registro de log
            await Output.create({
                exitDate: new Date(),
                justification,
                quantity,
                productionOrder,
                itemId,
                unitPrice: costPerItem // Salva o CUSTO da saída no log
            }, { transaction });

            await transaction.commit();
            res.redirect('/movimentacoes');
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.error("Error creating exit:", error);
            res.status(500).send(`Error: ${error.message}`);
        }
    }
};

module.exports = movementController;