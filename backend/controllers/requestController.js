
// controllers/requestController.js
const { Sequelize, Op } = require('sequelize');
const { getTenantDB } = require('../config/database');
const db = require('../models');

const formatQuantity = (quantity, unitOfMeasure) => {
    const qty = parseFloat(quantity);

    if (unitOfMeasure === 'kg' || unitOfMeasure === 'g' || unitOfMeasure === 'ton') {
        // Para unidades de peso, mostra 2 casas decimais
        return qty.toFixed(2);
    } else if (unitOfMeasure === 'un' || unitOfMeasure === 'pc' || unitOfMeasure === 'cx') {
        // Para unidades, mostra como inteiro se for número redondo
        return qty % 1 === 0 ? qty.toString() : qty.toFixed(2);
    } else {
        // Padrão: 2 casas decimais
        return qty.toFixed(2);
    }
};

const getUnitLabel = (unitOfMeasure) => {

    if (!unitOfMeasure) return 'un'; // Default para 'un' se for null/undefined

    const unitMap = {
        'un': 'un',
        'kg': 'kg',
        'g': 'g',
        'ton': 'ton',
        'pc': 'pc',
        'cx': 'cx',
        'l': 'l',
        'ml': 'ml'
    };
    return unitMap[unitOfMeasure] || unitOfMeasure; // Retorna o próprio valor se não estiver no mapa
};

// Função auxiliar para obter o step do input
const getInputStep = (unitOfMeasure) => {
    if (!unitOfMeasure) return '0.01'; // Default

    if (['kg', 'g', 'ton', 'l', 'ml'].includes(unitOfMeasure)) {
        return '0.01';
    } else if (['un', 'pc'].includes(unitOfMeasure)) {
        return '1';
    } else if (unitOfMeasure === 'cx') {
        return '0.5';
    } else {
        return '0.01';
    }
};



const calculateAvgCost = (item) => {
    const totalQuantity = parseFloat(item.quantity) + parseFloat(item.reservedQuantity);
    const totalValue = parseFloat(item.totalValue);
    if (totalQuantity <= 0 || totalValue <= 0) {
        return 0;
    }
    return totalValue / totalQuantity;
};

const requestController = {

    // getAll: async (req, res) => {
    //     const { tenantId } = req;
    //     try {
    //         const sequelize = await getTenantDB(tenantId);
    //         const { Request, Employee, Item, RequestItem } = db.initialize(sequelize);

    //         const requests = await Request.findAll({
    //             include: [
    //                 { model: Employee, as: 'requester', attributes: ['name'] },
    //                 { model: Employee, as: 'approver', attributes: ['name'] },
    //                 {
    //                     model: RequestItem,
    //                     as: 'items',
    //                     include: [{
    //                         model: Item,
    //                         as: 'item',
    //                         attributes: ['name', 'code', 'unitOfMeasure']
    //                     }]
    //                 }
    //             ],
    //             order: [['created_at', 'DESC']]
    //         });

    //         res.render('requisicoes', {
    //             requests,
    //             user: req.session.user,
    //             query: req.query,
    //             paginaAtiva: 'requisicoes'
    //         });
    //     } catch (error) {
    //         res.redirect(`/itens?error=${error.message}`);
    //     }
    // },
getAll: async (req, res) => {
    const { tenantId } = req;
    try {
        const sequelize = await getTenantDB(tenantId);
        const { Request, Employee, Item, RequestItem } = db.initialize(sequelize);

        const requests = await Request.findAll({
            include: [
                { 
                    model: Employee, 
                    as: 'requester', 
                    attributes: ['id', 'name', 'photo'] // photo é BLOB
                },
                { 
                    model: Employee, 
                    as: 'approver', 
                    attributes: ['id', 'name', 'photo'] // photo é BLOB
                },
                {
                    model: RequestItem,
                    as: 'items',
                    include: [{
                        model: Item,
                        as: 'item',
                        attributes: ['name', 'code', 'unitOfMeasure']
                    }]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Converter BLOB para base64
        const requestsWithPhotos = requests.map(request => {
            const requestJSON = request.toJSON();
            
            // Converter foto do solicitante
            if (requestJSON.requester && requestJSON.requester.photo) {
                requestJSON.requester.photo = `data:image/jpeg;base64,${requestJSON.requester.photo.toString('base64')}`;
            }
            
            // Converter foto do aprovador
            if (requestJSON.approver && requestJSON.approver.photo) {
                requestJSON.approver.photo = `data:image/jpeg;base64,${requestJSON.approver.photo.toString('base64')}`;
            }
            
            return requestJSON;
        });

        // DEBUG: Verificar se as fotos estão sendo convertidas
        requestsWithPhotos.forEach((request, index) => {
            console.log(`Requisição ${index + 1}:`, {
                id: request.id,
                requester: request.requester ? {
                    name: request.requester.name,
                    hasPhoto: !!request.requester.photo,
                    photoType: request.requester.photo ? typeof request.requester.photo : 'none'
                } : 'N/A'
            });
        });

        res.render('requisicoes', {
            requests: requestsWithPhotos, // Usar o array convertido
            user: req.session.user,
            query: req.query,
            paginaAtiva: 'requisicoes'
        });
    } catch (error) {
        console.error("❌ Erro ao buscar requisições:", error);
        res.redirect('/requisicoes?error=fetch_failed');
    }
},


    create: async (req, res) => {
        const { tenantId } = req;
        const employeeId = req.session.user.id;
        const { notes, items } = req.body;
        let transaction;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Nenhum item selecionado.' });
        }

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, Request, RequestItem } = db.initialize(sequelize);
            transaction = await sequelize.transaction();

            const newRequest = await Request.create({
                employeeId: employeeId,
                notes: notes,
                status: 'Pendente'
            }, { transaction });

            for (const reqItem of items) {
                const item = await Item.findByPk(reqItem.id, { transaction, lock: true });

                const availableStock = parseFloat(item.quantity) - parseFloat(item.reservedQuantity);
                const requestQuantity = parseFloat(reqItem.quantity);

                if (availableStock < requestQuantity) {
                    const unitLabel = getUnitLabel(item.unitOfMeasure);
                    throw new Error(`Estoque insuficiente para o item '${item.name}'. Disponível: ${formatQuantity(availableStock, item.unitOfMeasure)} ${unitLabel}`);
                }

                await item.decrement('quantity', { by: requestQuantity, transaction });
                await item.increment('reservedQuantity', { by: requestQuantity, transaction });

                await RequestItem.create({
                    requestId: newRequest.id,
                    itemId: item.id,
                    quantityRequested: requestQuantity
                }, { transaction });
            }

            await transaction.commit();
            res.status(201).json({ message: 'Requisição criada com sucesso!', redirectUrl: '/requisicoes?success=request_created' });

        } catch (error) {
            if (transaction) await transaction.rollback();
            console.error("Error creating request:", error);
            res.status(400).json({ error: error.message });
        }
    },

    approve: async (req, res) => {
        const { tenantId } = req;
        const { id: requestId } = req.params;
        const approverId = req.session.user.id;
        let transaction;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, Request, RequestItem, Output } = db.initialize(sequelize);
            transaction = await sequelize.transaction();

            const request = await Request.findByPk(requestId, {
                include: [{ model: RequestItem, as: 'items' }],
                transaction
            });
            if (request.status !== 'Pendente') throw new Error('Esta requisição não está mais pendente.');

            for (const reqItem of request.items) {
                const item = await Item.findByPk(reqItem.itemId, { transaction, lock: true });

                const costPerItem = calculateAvgCost(item);
                const valueToExit = costPerItem * parseFloat(reqItem.quantityRequested);

                await item.decrement('reservedQuantity', { by: reqItem.quantityRequested, transaction });
                await item.decrement('totalValue', { by: valueToExit, transaction });

                await Output.create({
                    itemId: item.id,
                    quantity: reqItem.quantityRequested,
                    unitPrice: costPerItem,
                    exitDate: new Date(),
                    justification: `Requisição #${requestId}: ${request.notes}`
                }, { transaction });
            }

            await request.update({
                status: 'Finalizado',
                approverId: approverId,
                completedAt: new Date()
            }, { transaction });

            await transaction.commit();
            res.redirect('/requisicoes?success=request_approved');

} catch (error) {
    let errorKey = 'approve_failed';
    if (error.message.includes('não está mais pendente')) {
        errorKey = 'request_not_pending';
    }
    res.redirect(`/requisicoes?error=${errorKey}`);
}
    },

    cancel: async (req, res) => {
        const { tenantId } = req;
        const { id: requestId } = req.params;
        let transaction;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, Request, RequestItem } = db.initialize(sequelize);
            transaction = await sequelize.transaction();

            const request = await Request.findByPk(requestId, {
                include: [{ model: RequestItem, as: 'items' }],
                transaction
            });
            if (request.status !== 'Pendente') throw new Error('Apenas requisições pendentes podem ser canceladas.');

            for (const reqItem of request.items) {
                const item = await Item.findByPk(reqItem.itemId, { transaction, lock: true });

                await item.decrement('reservedQuantity', { by: reqItem.quantityRequested, transaction });
                await item.increment('quantity', { by: reqItem.quantityRequested, transaction });
            }

            await request.update({
                status: 'Cancelado',
                approverId: req.session.user.id,
                completedAt: new Date()
            }, { transaction });

            await transaction.commit();
            res.redirect('/requisicoes?success=request_cancelled');

} catch (error) {
    let errorKey = 'cancel_failed';
    if (error.message.includes('apenas requisições pendentes')) {
        errorKey = 'only_pending_cancellable';
    }
    res.redirect(`/requisicoes?error=${errorKey}`);
}
    },


    showReturnForm: async (req, res) => {
        const { tenantId } = req;
        const { id: requestId } = req.params;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Request, RequestItem, Item, Employee } = db.initialize(sequelize);

            const request = await Request.findByPk(requestId, {
                include: [
                    { model: Employee, as: 'requester', attributes: ['name'] },
                    {
                        model: RequestItem,
                        as: 'items',
                        include: [{
                            model: Item,
                            as: 'item',
                            attributes: ['id', 'name', 'code', 'unitOfMeasure']
                        }]
                    }
                ]
            });

            if (!request) {
                return res.redirect('/requisicoes?error=Requisição não encontrada');
            }

            if (request.status !== 'Finalizado') {
                return res.redirect('/requisicoes?error=Apenas requisições finalizadas podem ter itens devolvidos');
            }

            res.render('requisicoes-devolucao', {
                request,
                user: req.session.user,
                query: req.query,
                paginaAtiva: 'requisicoes'
            });

} catch (error) {
    let errorKey = 'fetch_failed';
    if (error.message.includes('não encontrada')) {
        errorKey = 'request_not_found';
    } else if (error.message.includes('apenas requisições finalizadas')) {
        errorKey = 'only_finished_returnable';
    }
    res.redirect(`/requisicoes?error=${errorKey}`);
}
    },

processReturn: async (req, res) => {
    const { tenantId } = req;
    const { id: requestId } = req.params;
    const { itemId, quantity } = req.body;

    console.log('=== 🚀 PROCESSANDO DEVOLUÇÃO ===');
    console.log('Request ID:', requestId);
    console.log('Body:', req.body);
    console.log('Item ID:', itemId);
    console.log('Quantity:', quantity);

    let transaction;

    try {
        const sequelize = await getTenantDB(tenantId);
        const { Request, RequestItem, Item, Entry, Output } = db.initialize(sequelize);
        transaction = await sequelize.transaction();

        // Buscar requisição
        const request = await Request.findByPk(requestId, {
            include: [{
                model: RequestItem,
                as: 'items',
                include: [{ model: Item, as: 'item' }]
            }],
            transaction
        });

        if (!request || request.status !== 'Finalizado') {
            throw new Error('Requisição não encontrada ou não está finalizada');
        }

        // Validar dados
        if (!itemId || !quantity) {
            throw new Error('Dados incompletos para devolução');
        }

        const returnQty = parseFloat(quantity);
        if (returnQty <= 0) {
            throw new Error('Quantidade deve ser maior que zero');
        }

        // Buscar item específico na requisição
        const reqItem = request.items.find(item => item.itemId == itemId);
        if (!reqItem) {
            throw new Error('Item não encontrado na requisição');
        }

        const item = await Item.findByPk(itemId, { transaction, lock: true });
        if (!item) {
            throw new Error('Item não encontrado no estoque');
        }

        // Validar quantidade
        const alreadyReturned = parseFloat(reqItem.quantityReturned || 0);
        const maxReturnable = parseFloat(reqItem.quantityRequested) - alreadyReturned;

        if (returnQty > maxReturnable) {
            throw new Error(`Não é possível devolver ${returnQty} unidades. Máximo: ${maxReturnable}`);
        }

        // 🔧 CORREÇÃO: Buscar o custo original da saída em vez de usar o custo médio atual
        const originalOutput = await Output.findOne({
            where: {
                itemId: item.id,
                justification: { [Op.like]: `%Requisição #${requestId}%` }
            },
            order: [['exitDate', 'DESC']],
            transaction
        });

        let costPerItem;
        if (originalOutput) {
            // Usar o custo original da saída
            costPerItem = parseFloat(originalOutput.unitPrice);
            console.log(`💰 Usando custo original da saída: ${costPerItem}`);
        } else {
            // Fallback: usar custo médio atual
            costPerItem = calculateAvgCost(item);
            console.log(`⚠️  Custo original não encontrado, usando custo médio: ${costPerItem}`);
        }

        const valueToReturn = costPerItem * returnQty;

        console.log(`📊 Devolução: ${returnQty} unidades x ${costPerItem} = ${valueToReturn}`);

        // Atualizar estoque
        await item.increment('quantity', { by: returnQty, transaction });
        await item.increment('totalValue', { by: valueToReturn, transaction });

        // Atualizar requisição
        await reqItem.increment('quantityReturned', { by: returnQty, transaction });

        // Registrar entrada
        const entryData = {
            itemId: item.id,
            quantity: returnQty,
            unitPrice: costPerItem,
            entryDate: new Date(),
            invoiceNumber: `DEV-REQ-${requestId}`,
            notes: `Devolução da requisição #${requestId} - Item: ${item.name}`
        };

        // Se supplierId for obrigatório, usar um valor padrão
        try {
            await Entry.create(entryData, { transaction });
        } catch (entryError) {
            if (entryError.name === 'SequelizeValidationError' && entryError.errors.find(e => e.path === 'supplierId')) {
                console.log('⚠️  Tentando criar entrada com supplierId padrão...');
                entryData.supplierId = 1;
                await Entry.create(entryData, { transaction });
            } else {
                throw entryError;
            }
        }

        // Verificar se todos os itens foram devolvidos
        const allItemsReturned = request.items.every(item =>
            parseFloat(item.quantityReturned || 0) >= parseFloat(item.quantityRequested)
        );

        if (allItemsReturned) {
            await request.update({
                status: 'Devolvido',
                updatedAt: new Date()
            }, { transaction });
        }

        await transaction.commit();

        console.log('✅ Devolução processada com sucesso');
        console.log(`📦 Estoque atualizado: Quantidade = ${parseFloat(item.quantity) + returnQty}, Valor = ${parseFloat(item.totalValue) + valueToReturn}`);
        
        res.redirect('/requisicoes?success=devolucao_processada');

} catch (error) {
    console.error('❌ Erro na devolução:', error);
    if (transaction) await transaction.rollback();
    
    let errorKey = 'return_failed';
    if (error.message.includes('não encontrada') || error.message.includes('não está finalizada')) {
        errorKey = 'invalid_return_request';
    } else if (error.message.includes('Dados incompletos')) {
        errorKey = 'incomplete_data';
    } else if (error.message.includes('Quantidade deve ser maior')) {
        errorKey = 'invalid_quantity';
    } else if (error.message.includes('Item não encontrado')) {
        errorKey = 'item_not_found';
    } else if (error.message.includes('Não é possível devolver')) {
        errorKey = 'excess_return_quantity';
    }
    
    res.redirect(`/requisicoes/devolucao/${requestId}?error=${errorKey}`);
}
},

    searchItems: async (req, res) => {
    const { tenantId } = req;
    const { q } = req.query;
    
    try {
        const sequelize = await getTenantDB(tenantId);
        const { Item } = db.initialize(sequelize);
        const { Op } = require('sequelize');


        const items = await Item.findAll({
            where: {
                status: 'Ativo',
                [Op.or]: [
                    { name: { [Op.like]: `%${q}%` } },
                    { code: { [Op.like]: `%${q}%` } }
                ]
            },
            attributes: ['id', 'name', 'code', 'quantity', 'reservedQuantity', 'unitOfMeasure'],
            limit: 20
        });


        const itemsWithAvailable = items.map(item => {
            console.log('📝 Item:', item.name, 'unitOfMeasure:', item.unitOfMeasure);
            return {
                id: item.id,
                name: item.name,
                code: item.code,
                availableQuantity: parseFloat(item.quantity) - parseFloat(item.reservedQuantity),
                unitOfMeasure: item.unitOfMeasure
            };
        });

        res.json(itemsWithAvailable);
    } catch (error) {
        console.error('❌ Erro na busca de itens:', error);
        res.status(500).json({ error: error.message });
    }
},

    // returnComplete: async (req, res) => {
    //     const { tenantId } = req;
    //     const { id: requestId } = req.params;

    //     console.log('=== 🚀 DEVOLUÇÃO COMPLETA ===');
    //     console.log('Request ID:', requestId);

    //     let transaction;

    //     try {
    //         const sequelize = await getTenantDB(tenantId);
    //         const { Request, RequestItem, Item, Entry } = db.initialize(sequelize);
    //         transaction = await sequelize.transaction();

    //         const request = await Request.findByPk(requestId, {
    //             include: [{
    //                 model: RequestItem,
    //                 as: 'items',
    //                 include: [{ model: Item, as: 'item' }]
    //             }],
    //             transaction
    //         });

    //         if (!request || request.status !== 'Finalizado') {
    //             throw new Error('Requisição não encontrada ou não está finalizada');
    //         }

    //         let totalReturned = 0;

    //         for (const reqItem of request.items) {
    //             const alreadyReturned = parseFloat(reqItem.quantityReturned || 0);
    //             const remainingToReturn = parseFloat(reqItem.quantityRequested) - alreadyReturned;

    //             if (remainingToReturn <= 0) continue;

    //             const item = await Item.findByPk(reqItem.itemId, { transaction, lock: true });
    //             const costPerItem = calculateAvgCost(item);
    //             const valueToReturn = costPerItem * remainingToReturn;

    //             // Atualizar estoque
    //             await item.increment('quantity', { by: remainingToReturn, transaction });
    //             await item.increment('totalValue', { by: valueToReturn, transaction });

    //             // Atualizar requisição
    //             await reqItem.update({
    //                 quantityReturned: parseFloat(reqItem.quantityRequested)
    //             }, { transaction });

    //             // Registrar entrada - CORRIGIDO: sem supplierId ou com valor padrão
    //             const entryData = {
    //                 itemId: item.id,
    //                 quantity: remainingToReturn,
    //                 unitPrice: costPerItem,
    //                 entryDate: new Date(),
    //                 invoiceNumber: `DEV-COMPLETA-REQ-${requestId}`,
    //                 notes: `Devolução completa da requisição #${requestId}`
    //             };

    //             // Se supplierId for obrigatório, usar um valor padrão ou buscar do item
    //             try {
    //                 // Tenta criar sem supplierId primeiro
    //                 await Entry.create(entryData, { transaction });
    //             } catch (entryError) {
    //                 if (entryError.name === 'SequelizeValidationError' && entryError.errors.find(e => e.path === 'supplierId')) {
    //                     // Se o erro for por supplierId, tentar com um valor padrão
    //                     console.log('⚠️  Tentando criar entrada com supplierId padrão...');
    //                     entryData.supplierId = 1; // Ou outro ID padrão do seu sistema
    //                     await Entry.create(entryData, { transaction });
    //                 } else {
    //                     throw entryError;
    //                 }
    //             }

    //             totalReturned += remainingToReturn;
    //             console.log(`✅ Devolvido: ${remainingToReturn} unidades de ${item.name}`);
    //         }

    //         if (totalReturned === 0) {
    //             throw new Error('Todos os itens já foram devolvidos');
    //         }

    //         // Atualizar status
    //         await request.update({
    //             status: 'Devolvido',
    //             updatedAt: new Date()
    //         }, { transaction });

    //         await transaction.commit();

    //         console.log('✅ Devolução completa processada');
    //         res.redirect('/requisicoes?success=devolucao_completa');

    //     } catch (error) {
    //         console.error('❌ Erro na devolução completa:', error);
    //         if (transaction) await transaction.rollback();
    //         res.redirect(`/requisicoes/devolucao/${requestId}?error=${encodeURIComponent(error.message)}`);
    //     }
    // },

    // NOVO: Devolução completa - CORRIGIDO O CÁLCULO DO VALOR
returnComplete: async (req, res) => {
    const { tenantId } = req;
    const { id: requestId } = req.params;

    console.log('=== 🚀 DEVOLUÇÃO COMPLETA ===');
    console.log('Request ID:', requestId);

    let transaction;

    try {
        const sequelize = await getTenantDB(tenantId);
        const { Request, RequestItem, Item, Entry, Output } = db.initialize(sequelize);
        transaction = await sequelize.transaction();

        const request = await Request.findByPk(requestId, {
            include: [{
                model: RequestItem,
                as: 'items',
                include: [{ model: Item, as: 'item' }]
            }],
            transaction
        });

        if (!request || request.status !== 'Finalizado') {
            throw new Error('Requisição não encontrada ou não está finalizada');
        }

        let totalReturned = 0;
        let totalValueReturned = 0;

        for (const reqItem of request.items) {
            const alreadyReturned = parseFloat(reqItem.quantityReturned || 0);
            const quantityRequested = parseFloat(reqItem.quantityRequested);
            const remainingToReturn = quantityRequested - alreadyReturned;

            if (remainingToReturn <= 0) continue;

            const item = await Item.findByPk(reqItem.itemId, { transaction, lock: true });
            
            // 🔧 CORREÇÃO: Buscar o custo original da saída
            const originalOutput = await Output.findOne({
                where: {
                    itemId: item.id,
                    justification: { [Op.like]: `%Requisição #${requestId}%` }
                },
                order: [['exitDate', 'DESC']],
                transaction
            });

            let costPerItem;
            if (originalOutput) {
                costPerItem = parseFloat(originalOutput.unitPrice);
                console.log(`💰 Item ${item.name}: usando custo original ${costPerItem}`);
            } else {
                costPerItem = calculateAvgCost(item);
                console.log(`⚠️  Item ${item.name}: custo original não encontrado, usando médio ${costPerItem}`);
            }

            const valueToReturn = costPerItem * remainingToReturn;

            console.log(`📊 ${item.name}: ${remainingToReturn} unidades x ${costPerItem} = ${valueToReturn}`);

            // Atualizar estoque
            await item.increment('quantity', { by: remainingToReturn, transaction });
            await item.increment('totalValue', { by: valueToReturn, transaction });

            // Atualizar requisição
            await reqItem.update({
                quantityReturned: quantityRequested
            }, { transaction });

            // Registrar entrada
            const entryData = {
                itemId: item.id,
                quantity: remainingToReturn,
                unitPrice: costPerItem,
                entryDate: new Date(),
                invoiceNumber: `DEV-COMPLETA-REQ-${requestId}`,
                notes: `Devolução completa da requisição #${requestId}`
            };

            try {
                await Entry.create(entryData, { transaction });
            } catch (entryError) {
                if (entryError.name === 'SequelizeValidationError' && entryError.errors.find(e => e.path === 'supplierId')) {
                    console.log('⚠️  Tentando criar entrada com supplierId padrão...');
                    entryData.supplierId = 1;
                    await Entry.create(entryData, { transaction });
                } else {
                    throw entryError;
                }
            }

            totalReturned += remainingToReturn;
            totalValueReturned += valueToReturn;
            console.log(`✅ Devolvido: ${remainingToReturn} unidades de ${item.name} (Valor: ${valueToReturn})`);
        }

        if (totalReturned === 0) {
            throw new Error('Todos os itens já foram devolvidos');
        }

        // Atualizar status
        await request.update({
            status: 'Devolvido',
            updatedAt: new Date()
        }, { transaction });

        await transaction.commit();

        console.log('✅ Devolução completa processada');
        console.log(`📊 Total: ${totalReturned} unidades devolvidas, Valor total: ${totalValueReturned}`);
        
        res.redirect('/requisicoes?success=devolucao_completa');

} catch (error) {
    console.error('❌ Erro na devolução completa:', error);
    if (transaction) await transaction.rollback();
    
    let errorKey = 'complete_return_failed';
    if (error.message.includes('Todos os itens já foram devolvidos')) {
        errorKey = 'all_items_returned';
    } else if (error.message.includes('não encontrada') || error.message.includes('não está finalizada')) {
        errorKey = 'invalid_return_request';
    }
    
    res.redirect(`/requisicoes/devolucao/${requestId}?error=${errorKey}`);
}
},

    showCreateForm: async (req, res) => {
        res.render('requisicoes-nova', {
            user: req.session.user,
            query: req.query,
            paginaAtiva: 'requisicoes'
        });
    }
};

module.exports = requestController;