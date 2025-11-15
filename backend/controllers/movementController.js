// // controllers/movementController.js (em inglês)
// const { Sequelize, Op } = require('sequelize');
// const { getTenantDB } = require('../config/database');
// const db = require('../models');

// const movementController = {
//     getAll: async (req, res) => {
//         const { tenantId } = req;
//         // 1. Captura filtros E parâmetros de ordenação
//         const {
//             itemId,
//             supplierId,
//             movementType,
//             details,
//             startDate,
//             endDate,
//             sort,
//             order
//         } = req.query;

//         try {
//             const sequelize = await getTenantDB(tenantId);
//             const { Entry, Output, Item, Supplier, Employee ,Stock} = db.initialize(sequelize);

//             // --- 2. Lógica de Filtro (Where) ---
//             const entryWhere = {};
//             const outputWhere = {};

//             if (itemId && itemId !== "") {
//                 entryWhere.itemId = itemId;
//                 outputWhere.itemId = itemId;
//             }

//             let start, end;
//             if (startDate) {
//                 // Força a data de início para o primeiro segundo do dia em UTC
//                 start = new Date(startDate + 'T00:00:00.000Z');
//             }
//             if (endDate) {
//                 // Força a data de fim para o último segundo do dia em UTC
//                 end = new Date(endDate + 'T23:59:59.999Z');
//             }

//             if (start && end) {
//                 entryWhere.entryDate = { [Op.between]: [start, end] };
//                 outputWhere.exitDate = { [Op.between]: [start, end] };
//             } else if (start) {
//                 entryWhere.entryDate = { [Op.gte]: start };
//                 outputWhere.exitDate = { [Op.gte]: start };
//             } else if (end) {
//                 entryWhere.entryDate = { [Op.lte]: end };
//                 outputWhere.exitDate = { [Op.lte]: end };
//             }

//             if (supplierId && supplierId !== "") {
//                 entryWhere.supplierId = supplierId;
//             }

//             if (details && details !== "") {
//                 outputWhere[Op.or] = [
//                     { justification: { [Op.like]: `%${details}%` } },
//                     { productionOrder: { [Op.like]: `%${details}%` } },
//                 ];
//             }

//             // --- 3. Busca de Dados ---
//             let entries = [];
//             let outputs = [];

//             const includeItem = [{ model: Item, as: 'item', attributes: ['name', 'code'] }]; // Adicionado 'code' para consistência
//             const includeItemAndSupplier = [
//                 { model: Item, as: 'item', attributes: ['name', 'code'] },
//                 { model: Supplier, as: 'supplier', attributes: ['name'] }
//             ];

//             if (!movementType || movementType === "" || movementType === "todos" || movementType === "Entrada") {
//                 entries = await Entry.findAll({
//                     where: entryWhere,
//                     include: includeItemAndSupplier
//                 });
//             }
//             if (!movementType || movementType === "" || movementType === "todos" || movementType === "Saída") {
//                 // A consulta 'outputWhere' agora contém o filtro 'details'
//                 outputs = await Output.findAll({
//                     where: outputWhere,
//                     include: includeItem
//                 });
//             }

//             // 4. Mapeia e Mescla os resultados
//             const allMovements = [
//                 ...entries.map(e => ({
//                     type: 'Entrada',
//                     date: e.entryDate,
//                     quantity: e.quantity,
//                     unitPrice: e.unitPrice,
//                     item: e.item ? e.item.name : 'Item Deletado',
//                     details: e.invoiceNumber ?  `NF: ${e.invoiceNumber}` : e.supplier.name
//                 })),
//                 ...outputs.map(o => ({
//                     type: 'Saída',
//                     date: o.exitDate,
//                     quantity: -Math.abs(o.quantity),
//                     unitPrice: -Math.abs(o.unitPrice),
//                     item: o.item ? o.item.name : 'Item Deletado',
//                     details: o.productionOrder ? `OS: ${o.productionOrder}` : o.justification
//                 }))
//             ];

//             console.log(allMovements);


//             // --- 5. Lógica de Ordenação (aplicada no array mesclado) ---
//             const sortColumn = sort || 'date';
//             const sortOrder = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

//             allMovements.sort((a, b) => {
//                 let valA, valB;
//                 switch (sortColumn) {
//                     case 'item': valA = a.item.toLowerCase(); valB = b.item.toLowerCase(); break;
//                     case 'quantity': valA = a.quantity; valB = b.quantity; break;
//                     case 'type': valA = a.type.toLowerCase(); valB = b.type.toLowerCase(); break;
//                     case 'date': default: valA = new Date(a.date); valB = new Date(b.date); break;
//                 }

//                 // Esta função .sort() já lida com ASC e DESC corretamente.
//                 if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
//                 if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
//                 return 0;
//             });

//             // 6. Busca dados para os Filtros e Modais
//             // const items = await Item.findAll({
//             //     where: { status: 'Ativo' },
//             //     order: [['name', 'ASC']]
//             // });
// const departamentos = await Stock.findAll({
//     where: {
//         name: {
//             [Op.in]: ['Barras Cortadas', 'Chapas Cortadas']
//         }
//     },
//     attributes: ['id'] // Apenas os IDs
// });

// // Extrai os IDs
// const idsDepartamentos = departamentos.map(depto => depto.id);

// // Agora busca os itens excluindo esses IDs
// const items = await Item.findAll({
//     where: { 
//         status: 'Ativo',
//         id_stock: {
//             [Op.notIn]: idsDepartamentos
//         }
//     },
//     order: [['name', 'ASC']]
// });
            
            
//             const suppliers = await Supplier.findAll({
//                 where: { status: 'Ativo' },
//                 order: [['name', 'ASC']]
//             });
//             const employees = await Employee.findAll({ order: [['name', 'ASC']] });

//             // 7. Renderiza a view com TODOS os dados
//             res.render('movimentacoes', {
//                 movements: allMovements,
//                 items,
//                 suppliers,
//                 employees,
//                 filters: req.query,
//                 user: req.session.user,
//                 paginaAtiva: 'movimentacoes',
//                 currentSort: { column: sortColumn, order: sortOrder }
//             });

//         } catch (error) {
//             console.error("Error fetching data:", error);
//             res.status(500).send(`Error: ${error.message}`);
//         }
//     },


//     createEntry: async (req, res) => {
//         const { tenantId } = req;
//         // O formulário de entrada agora precisa enviar 'unitPrice'
//         const { itemId, quantity, supplierId, invoiceNumber, unitPrice } = req.body;
//         let transaction;

//         try {
//             const sequelize = await getTenantDB(tenantId);
//             const { Item, Entry } = db.initialize(sequelize);
//             transaction = await sequelize.transaction();

//             const item = await Item.findByPk(itemId, { transaction, lock: true });
//             if (!item) throw new Error('Item not found.');

//             const newEntryValue = parseFloat(quantity) * parseFloat(unitPrice);

//             // 1. Incrementa a quantidade
//             await item.increment('quantity', { by: quantity, transaction });
//             // 2. Incrementa o valor total
//             await item.increment('totalValue', { by: newEntryValue, transaction });

//             await Entry.create({
//                 entryDate: new Date(),
//                 invoiceNumber,
//                 quantity,
//                 supplierId,
//                 itemId,
//                 unitPrice // Salva o preço de compra desta entrada
//             }, { transaction });

//             await transaction.commit();
//             res.redirect('/movimentacoes');
//         } catch (error) {
//             if (transaction) await transaction.rollback();
//             console.error("Error creating entry:", error);
//             res.status(500).send(`Error: ${error.message}`);
//         }
//     },

//     createOutput: async (req, res) => {
//         const { tenantId } = req;
//         const { itemId, quantity, justification, productionOrder } = req.body;
//         let transaction;

//         try {
//             const sequelize = await getTenantDB(tenantId);
//             const { Item, Output } = db.initialize(sequelize);
//             transaction = await sequelize.transaction();

//             const item = await Item.findByPk(itemId, { transaction, lock: true });
//             if (!item) throw new Error('Item not found.');

//             const currentQuantity = parseFloat(item.quantity);
//             const currentValue = parseFloat(item.totalValue);
//             const availableStock = parseFloat(item.quantity) - parseFloat(item.reservedQuantity);
//             const quantityToExit = parseFloat(quantity);
//             if (availableStock < quantityToExit) {
//                 throw new Error(`Estoque disponível insuficiente. Disponível: ${availableStock}`);
//             }

//             // 1. Validação de estoque
//             if (currentQuantity < quantityToExit) {
//                 throw new Error('Not enough stock available.');
//             }

//             // 2. Cálculo do Custo Médio Ponderado (CMP)
//             // Custo Médio = Valor Total / Quantidade Total
//             // (Evita divisão por zero se a quantidade for 0)
//             const costPerItem = (currentQuantity > 0) ? (currentValue / currentQuantity) : 0;

//             // 3. Calcula o valor a ser debitado do estoque
//             const valueToExit = costPerItem * quantityToExit;

//             // 4. Decrementa a quantidade e o valor total
//             await item.decrement('quantity', { by: quantityToExit, transaction });
//             await item.decrement('totalValue', { by: valueToExit, transaction });

//             // 5. Cria o registro de log
//             await Output.create({
//                 exitDate: new Date(),
//                 justification,
//                 quantity,
//                 productionOrder,
//                 itemId,
//                 unitPrice: costPerItem // Salva o CUSTO da saída no log
//             }, { transaction });

//             await transaction.commit();
//             res.redirect('/movimentacoes');
//         } catch (error) {
//             if (transaction) await transaction.rollback();
//             console.error("Error creating exit:", error);
//             res.status(500).send(`Error: ${error.message}`);
//         }
//     }
// };

// module.exports = movementController;



// controllers/movementController.js
const { Sequelize, Op } = require('sequelize');
const { getTenantDB } = require('../config/database');
const db = require('../models');

const movementController = {
    getAll: async (req, res) => {
        const { tenantId } = req;
        
        if (!tenantId) {
            return res.status(400).render('error', {
                message: 'Identificação do sistema não encontrada',
                user: req.session.user,
                paginaAtiva: 'movimentacoes'
            });
        }

        const {
            itemId,
            supplierId,
            movementType,
            details,
            startDate,
            endDate,
            sort,
            order,
            success, // Parâmetros da URL
            error    // Parâmetros da URL
        } = req.query;

        try {
            const sequelize = await getTenantDB(tenantId);
            if (!sequelize) {
                throw new Error('Falha na conexão com o banco de dados');
            }

            const { Entry, Output, Item, Supplier, Employee, Stock } = db.initialize(sequelize);

            if (!Entry || !Output || !Item || !Supplier || !Employee || !Stock) {
                throw new Error('Erro na configuração do sistema');
            }

            // --- Lógica de Filtro ---
            const entryWhere = {};
            const outputWhere = {};

            if (itemId && itemId !== "" && !isNaN(parseInt(itemId))) {
                entryWhere.itemId = parseInt(itemId);
                outputWhere.itemId = parseInt(itemId);
            }

            let start, end;
            if (startDate) {
                start = new Date(startDate + 'T00:00:00.000Z');
                if (isNaN(start.getTime())) {
                    start = null;
                }
            }
            if (endDate) {
                end = new Date(endDate + 'T23:59:59.999Z');
                if (isNaN(end.getTime())) {
                    end = null;
                }
            }

            if (start && end && start > end) {
                return res.status(400).render('error', {
                    message: 'Data de início não pode ser maior que data de fim',
                    user: req.session.user,
                    paginaAtiva: 'movimentacoes'
                });
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

            if (supplierId && supplierId !== "" && !isNaN(parseInt(supplierId))) {
                entryWhere.supplierId = parseInt(supplierId);
            }

            if (details && details !== "") {
                const sanitizedDetails = details.replace(/[%_]/g, '\\$&');
                outputWhere[Op.or] = [
                    { justification: { [Op.like]: `%${sanitizedDetails}%` } },
                    { productionOrder: { [Op.like]: `%${sanitizedDetails}%` } },
                ];
            }

            // --- Busca de Dados ---
            let entries = [];
            let outputs = [];

            const includeItem = [{ 
                model: Item, 
                as: 'item', 
                attributes: ['name', 'code'],
                required: false
            }];
            
            const includeItemAndSupplier = [
                { 
                    model: Item, 
                    as: 'item', 
                    attributes: ['name', 'code'],
                    required: false 
                },
                { 
                    model: Supplier, 
                    as: 'supplier', 
                    attributes: ['name'],
                    required: false 
                }
            ];

            if (!movementType || movementType === "" || movementType === "todos" || movementType === "Entrada") {
                entries = await Entry.findAll({
                    where: entryWhere,
                    include: includeItemAndSupplier
                });
            }
            
            if (!movementType || movementType === "" || movementType === "todos" || movementType === "Saída") {
                outputs = await Output.findAll({
                    where: outputWhere,
                    include: includeItem
                });
            }

            // Mapeia e Mescla os resultados
            const allMovements = [
                ...entries.map(e => ({
                    type: 'Entrada',
                    date: e.entryDate || new Date(),
                    quantity: parseFloat(e.quantity) || 0,
                    unitPrice: parseFloat(e.unitPrice) || 0,
                    item: (e.item && e.item.name) ? e.item.name : 'Item Deletado',
                    details: e.invoiceNumber ? `NF: ${e.invoiceNumber}` : 
                            (e.supplier && e.supplier.name) ? e.supplier.name : 'Sem detalhes'
                })),
                ...outputs.map(o => ({
                    type: 'Saída',
                    date: o.exitDate || new Date(),
                    quantity: -Math.abs(parseFloat(o.quantity) || 0),
                    unitPrice: -Math.abs(parseFloat(o.unitPrice) || 0),
                    item: (o.item && o.item.name) ? o.item.name : 'Item Deletado',
                    details: o.productionOrder ? `OS: ${o.productionOrder}` : 
                            o.justification || 'Sem justificativa'
                }))
            ];

            // --- Ordenação ---
            const validSortColumns = ['item', 'quantity', 'type', 'date'];
            const sortColumn = validSortColumns.includes(sort) ? sort : 'date';
            const sortOrder = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            allMovements.sort((a, b) => {
                let valA, valB;
                switch (sortColumn) {
                    case 'item': 
                        valA = (a.item || '').toLowerCase(); 
                        valB = (b.item || '').toLowerCase(); 
                        break;
                    case 'quantity': 
                        valA = parseFloat(a.quantity) || 0; 
                        valB = parseFloat(b.quantity) || 0; 
                        break;
                    case 'type': 
                        valA = (a.type || '').toLowerCase(); 
                        valB = (b.type || '').toLowerCase(); 
                        break;
                    case 'date': default: 
                        valA = new Date(a.date || new Date()); 
                        valB = new Date(b.date || new Date()); 
                        break;
                }

                if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
                if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
                return 0;
            });

            // Busca dados para os Filtros
            let items = [];
            let suppliers = [];
            let employees = [];

            try {
                const departamentos = await Stock.findAll({
                    where: {
                        name: {
                            [Op.in]: ['Barras Cortadas', 'Chapas Cortadas']
                        }
                    },
                    attributes: ['id']
                });

                const idsDepartamentos = departamentos.map(depto => depto.id);

                items = await Item.findAll({
                    where: { 
                        status: 'Ativo',
                        id_stock: {
                            [Op.notIn]: idsDepartamentos
                        }
                    },
                    order: [['name', 'ASC']]
                });

                suppliers = await Supplier.findAll({
                    where: { status: 'Ativo' },
                    order: [['name', 'ASC']]
                });

                employees = await Employee.findAll({ 
                    order: [['name', 'ASC']] 
                });
            } catch (filterError) {
                console.error('Erro ao carregar filtros:', filterError);
            }

            // Remove os parâmetros de mensagem da URL para evitar repetição
            const cleanQuery = { ...req.query };
            delete cleanQuery.success;
            delete cleanQuery.error;

            res.render('movimentacoes', {
                movements: allMovements,
                items,
                suppliers,
                employees,
                filters: cleanQuery, // Usa query limpa sem mensagens
                user: req.session.user,
                paginaAtiva: 'movimentacoes',
                currentSort: { column: sortColumn, order: sortOrder },
                success: success, // Passa a mensagem de sucesso
                error: error      // Passa a mensagem de erro
            });

        } catch (error) {
            console.error("Error fetching data:", error);
            res.status(500).render('error', {
                message: 'Erro ao carregar movimentações. Tente novamente.',
                user: req.session.user,
                paginaAtiva: 'movimentacoes'
            });
        }
    },

    createEntry: async (req, res) => {
        const { tenantId } = req;
        
        if (!tenantId) {
            return res.redirect('/movimentacoes?error=' + encodeURIComponent('Erro de configuração do sistema'));
        }

        const { itemId, quantity, supplierId, invoiceNumber, unitPrice } = req.body;
        let transaction;

        if (!itemId || !quantity || !supplierId) {
            return res.redirect('/movimentacoes?error=' + encodeURIComponent('Item, quantidade e fornecedor são obrigatórios'));
        }

        const parsedQuantity = parseFloat(quantity);
        const parsedUnitPrice = parseFloat(unitPrice);

        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.redirect('/movimentacoes?error=' + encodeURIComponent('Quantidade deve ser um número positivo'));
        }

        if (isNaN(parsedUnitPrice) || parsedUnitPrice < 0) {
            return res.redirect('/movimentacoes?error=' + encodeURIComponent('Preço unitário deve ser um número não negativo'));
        }

        try {
            const sequelize = await getTenantDB(tenantId);
            if (!sequelize) {
                return res.redirect('/movimentacoes?error=' + encodeURIComponent('Falha na conexão com o banco de dados'));
            }

            const { Item, Entry } = db.initialize(sequelize);
            
            if (!Item || !Entry) {
                return res.redirect('/movimentacoes?error=' + encodeURIComponent('Erro na configuração do sistema'));
            }

            transaction = await sequelize.transaction();

            const item = await Item.findByPk(itemId, { transaction, lock: true });
            if (!item) {
                throw new Error('Item não encontrado no sistema');
            }

            const newEntryValue = parseFloat(quantity) * parseFloat(unitPrice);

            await item.increment('quantity', { by: quantity, transaction });
            await item.increment('totalValue', { by: newEntryValue, transaction });

            await Entry.create({
                entryDate: new Date(),
                invoiceNumber,
                quantity,
                supplierId,
                itemId,
                unitPrice
            }, { transaction });

            await transaction.commit();
            
            return res.redirect('/movimentacoes?success=' + encodeURIComponent('Entrada registrada com sucesso'));
            
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.error("Error creating entry:", error);
            
            const userMessage = error.message.includes('Item não encontrado') 
                ? 'Item não encontrado no sistema'
                : 'Erro ao registrar entrada. Tente novamente.';
            
            return res.redirect('/movimentacoes?error=' + encodeURIComponent(userMessage));
        }
    },

    createOutput: async (req, res) => {
        const { tenantId } = req;
        const { itemId, quantity, justification, productionOrder } = req.body;
        let transaction;

        if (!itemId || !quantity) {
            return res.redirect('/movimentacoes?error=' + encodeURIComponent('Item e quantidade são obrigatórios'));
        }

        const parsedQuantity = parseFloat(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.redirect('/movimentacoes?error=' + encodeURIComponent('Quantidade deve ser um número positivo'));
        }

        try {
            const sequelize = await getTenantDB(tenantId);
            if (!sequelize) {
                return res.redirect('/movimentacoes?error=' + encodeURIComponent('Falha na conexão com o banco de dados'));
            }

            const { Item, Output } = db.initialize(sequelize);
            
            if (!Item || !Output) {
                return res.redirect('/movimentacoes?error=' + encodeURIComponent('Erro na configuração do sistema'));
            }

            transaction = await sequelize.transaction();

            const item = await Item.findByPk(itemId, { transaction, lock: true });
            if (!item) {
                throw new Error('Item não encontrado no sistema');
            }

            const availableStock = parseFloat(item.quantity) - parseFloat(item.reservedQuantity);
            const quantityToExit = parseFloat(quantity);
            
            if (availableStock < quantityToExit) {
                throw new Error(`Estoque disponível insuficiente. Disponível: ${availableStock}`);
            }

            const currentQuantity = parseFloat(item.quantity);
            if (currentQuantity < quantityToExit) {
                throw new Error('Quantidade em estoque insuficiente para esta saída');
            }

            const currentValue = parseFloat(item.totalValue);
            const costPerItem = (currentQuantity > 0) ? (currentValue / currentQuantity) : 0;
            const valueToExit = costPerItem * quantityToExit;

            await item.decrement('quantity', { by: quantityToExit, transaction });
            await item.decrement('totalValue', { by: valueToExit, transaction });

            await Output.create({
                exitDate: new Date(),
                justification,
                quantity,
                productionOrder,
                itemId,
                unitPrice: costPerItem
            }, { transaction });

            await transaction.commit();
            
            return res.redirect('/movimentacoes?success=' + encodeURIComponent('Saída registrada com sucesso'));
            
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.error("Error creating exit:", error);
            
            let userMessage;
            if (error.message.includes('Estoque disponível insuficiente')) {
                userMessage = error.message;
            } else if (error.message.includes('Quantidade em estoque insuficiente')) {
                userMessage = 'Quantidade em estoque insuficiente para esta saída';
            } else if (error.message.includes('Item não encontrado')) {
                userMessage = 'Item não encontrado no sistema';
            } else {
                userMessage = 'Erro ao registrar saída. Tente novamente.';
            }
            
            return res.redirect('/movimentacoes?error=' + encodeURIComponent(userMessage));
        }
    }
};

module.exports = movementController;