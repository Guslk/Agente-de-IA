// // controllers/itemController.js

// const { Sequelize, Op } = require('sequelize');
// const { getTenantDB } = require('../config/database');
// const db = require('../models');

// const itemController = {

//     showCreateForm: (req, res) => {
//         res.render('itens/novo', { error: null });
//     },

//     create: async (req, res) => {
//         const { tenantId } = req;
//         // Recebe os nomes corretos do formulário .ejs
//         const { nome, id_stock, codigo_barras, descricao, unidade_medida, quantidade_minima, loc_corredor, loc_prateleira, loc_posicao, maximumQuantity } = req.body;
//         try {
//             const sequelize = await getTenantDB(tenantId);
//             const { Item } = db.initialize(sequelize);

//             await Item.create({
//                 name: nome,
//                 stockId: id_stock,
//                 code: codigo_barras,
//                 description: descricao,
//                 unitOfMeasure: unidade_medida,
//                 minimumQuantity: quantidade_minima,
//                 maximumQuantity: maximumQuantity,
//                 position: `${loc_corredor}-${loc_prateleira}-${loc_posicao}`
//             });
//             res.redirect('/itens?success=item_created');
//         } catch (error) {
//             console.error("Error creating item:", error);
//             res.status(500).send(`Error creating item: ${error.message}`);
//         }
//     },

//     getAll: async (req, res) => {
//         const { tenantId } = req;
//         // 1. Captura TODOS os filtros e parâmetros de ordenação
//         const {
//             busca,       // Busca por Nome
//             code,        // Busca por Código
//             position,    // Busca por Localização
//             status,      // Filtro de Status (Ativo, Desativado)
//             filtroStatus, // Filtro de Estoque (Baixo, Normal, Esgotado)
//             sort,
//             order
//         } = req.query;

//         try {
//             const sequelize = await getTenantDB(tenantId);
//             const { Item, Stock } = db.initialize(sequelize);

//             // --- 2. Lógica de Filtro (Where) ---

//             // Filtro principal: Itens Ativos e Desativados (a Lixeira é separada)
//             const whereClause = {
//                 status: { [Op.in]: ['Ativo', 'Desativado'] }
//             };

//             // Adiciona filtros em cadeia
//             if (busca && busca !== "") {
//                 whereClause.name = { [Op.like]: `%${busca}%` };
//             }
//             if (code && code !== "") {
//                 whereClause.code = { [Op.like]: `%${code}%` };
//             }
//             if (position && position !== "") {
//                 whereClause.position = { [Op.like]: `%${position}%` };
//             }
//             if (status && status !== 'todos') {
//                 whereClause.status = status; // Filtra por Ativo ou Desativado
//             }

//             // Adiciona o filtro de status de ESTOQUE
//             if (filtroStatus && filtroStatus !== 'todos') {
//                 if (filtroStatus === 'esgotado') {
//                     whereClause.quantity = { [Op.lte]: 0 };
//                 } else if (filtroStatus === 'baixo') {
//                     whereClause.quantity = {
//                         [Op.gt]: 0,
//                         [Op.lt]: Sequelize.col('minimum_quantity')
//                     };
//                 } else if (filtroStatus === 'normal') {
//                     whereClause.quantity = { [Op.gte]: Sequelize.col('minimum_quantity') };
//                 }
//             }

//             // --- 3. Lógica de Ordenação ---
//             const allowedSortColumns = ['name', 'quantity', 'department', 'position', 'status', 'code', 'description', 'minimumQuantity', 'maximumQuantity'];
//             let sortColumn = sort || 'name'; // Padrão é ordenar por nome
//             let sortOrder = order && ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

//             if (!allowedSortColumns.includes(sortColumn)) {
//                 sortColumn = 'name';
//             }

//             // A ordenação por 'department' funciona por causa do alias [Sequelize.col('stock.name_stock'), 'department']
//             const finalOrder = [[sortColumn, sortOrder]];

//             // --- 4. Busca de Dados ---
//             const items = await Item.findAll({
//                 where: whereClause,
//                 include: [{
//                     model: Stock,
//                     as: 'stock',
//                     attributes: []
//                 }],
//                 attributes: {
//                     // Seleciona todas as colunas de Item
//                     // (O 'field' no modelo cuida dos nomes como 'minimum_quantity')
//                     exclude: ['stockId'],
//                     include: [
//                         [Sequelize.col('stock.name_stock'), 'department']

//                     ]
//                 },
//                 order: finalOrder, // <-- Aplica a ordenação dinâmica
//                 raw: true,
//                 nest: true
//             });

//             // Busca a Lixeira (com filtros de busca, mas sem filtro de status de estoque)
//             const excludedWhere = { status: 'Excluido' };
//             if (busca) excludedWhere.name = { [Op.like]: `%${busca}%` };
//             if (code) excludedWhere.code = { [Op.like]: `%${code}%` };
//             if (position) excludedWhere.position = { [Op.like]: `%${position}%` };

//             const excludedItems = await Item.findAll({
//                 where: excludedWhere,
//                 include: [{ model: Stock, as: 'stock', attributes: ['name'] }],
//                 order: [['name', 'ASC']],
//                 raw: true, // Adicionado para consistência
//                 nest: true  // Adicionado para consistência
//             });

//             // Busca Estoques para os modais
//             const stocks = await Stock.findAll({ order: [['name', 'ASC']] });

//             // 5. Renderiza a view com TODOS os dados
//             res.render('itens', { // Ou 'index.ejs'
//                 items: items,
//                 excludedItems: excludedItems,
//                 stocks: stocks,
//                 user: req.session.user,
//                 query: req.query,
//                 filters: req.query, // Passa todos os filtros de volta
//                 currentSort: { column: sortColumn, order: sortOrder } // Passa a ordenação atual
//             });

//         } catch (error) {
//             console.error("Erro ao buscar itens:", error);
//             res.status(500).send(`Erro ao buscar itens: ${error.message}`);
//         }
//     },

//     restore: async (req, res) => {
//         const { tenantId } = req;
//         const { id } = req.params; // Pega o ID do item da URL

//         try {
//             const sequelize = await getTenantDB(tenantId);
//             const { Item } = db.initialize(sequelize);

//             const item = await Item.findByPk(id);

//             if (item) {
//                 // Apenas muda o status de volta para 'Ativo'
//                 await item.update({ status: 'Ativo' });

//                 res.redirect('/itens?success=item_restored');
//             } else {
//                 res.redirect('/itens?error=item_not_found');
//             }
//         } catch (error) {
//             console.error("Erro ao restaurar item:", error);
//             res.redirect(`/itens?error=${error.message || 'restore_failed'}`);
//         }
//     },

//     showEditForm: async (req, res) => {
//         const { tenantId } = req;
//         if (!tenantId) return res.status(400).send("Erro: Inquilino não identificado.");

//         try {
//             const sequelize = await getTenantDB(tenantId);
//             // Chama o método 'initialize' para obter os modelos
//             const { Item } = db.initialize(sequelize);

//             const item = await Item.findByPk(req.params.id);
//             if (item) {
//                 res.render('itens/editar', { item, error: null });
//             } else {
//                 res.status(404).send('Item não encontrado.');
//             }
//         } catch (error) {
//             res.status(500).send(`Erro ao buscar item: ${error.message}`);
//         }
//     },
//     update: async (req, res) => {
//         const { tenantId } = req;
//         const { id } = req.params; // Pega o ID do item da URL

//         if (!tenantId) return res.status(400).send("Erro: Inquilino não identificado.");

//         try {
//             const sequelize = await getTenantDB(tenantId);
//             const { Item } = db.initialize(sequelize);

//             // 1. Encontra o item que será atualizado
//             const item = await Item.findByPk(id);

//             if (item) {
//                 // 2. Monta o objeto com os dados atualizados do formulário
//                 const dadosAtualizados = {
//                     name: req.body.nome,
//                     code: req.body.codigo_barras,
//                     description: req.body.descricao,
//                     unitOfMeasure: req.body.unidade_medida,
//                     minimumQuantity: req.body.quantidade_minima,
//                     id_stock: req.body.id_stock, // Atualiza o estoque
//                     maximumQuantity: req.body.maximumQuantity,
//                     status: req.body.status,
//                     position: `${req.body.loc_corredor}-${req.body.loc_prateleira}-${req.body.loc_posicao}`
//                 };

//                 // 3. Salva as alterações no banco de dados
//                 await item.update(dadosAtualizados);

//                 // 4. Redireciona de volta para a lista de itens
//                 res.redirect('/itens?sucesso=item_atualizado');
//             } else {
//                 res.status(404).send('Item não encontrado para atualizar.');
//             }
//         } catch (error) {
//             console.error("Erro ao atualizar item:", error);
//             res.status(500).send(`Erro ao atualizar item: ${error.message}`);
//         }
//     },
//     searchActiveItems: async (req, res) => {
//         const { tenantId } = req;
//         const { q } = req.query; // 'q' é o termo da busca (ex: "mouse")

//         try {
//             const sequelize = await getTenantDB(tenantId);
//             const { Item } = db.initialize(sequelize);

//             const whereClause = {
//                 status: 'Ativo'
//             };

//             // Se um termo de busca (q) foi fornecido, adiciona o filtro 'like'
//             if (q) {
//                 whereClause.name = {
//                     [Op.like]: `%${q}%`
//                 };
//             }

//             const items = await Item.findAll({
//                 where: whereClause,
//                 limit: 20,
//                 order: [['name', 'ASC']],
//                 attributes: ['id', 'name', 'code', 'quantity', 'reservedQuantity'] // Envia a quantidade
//             });

//             // Mapeia para incluir a 'availableQuantity'
//             const results = items.map(item => {
//                 const available = parseFloat(item.quantity) - parseFloat(item.reservedQuantity);
//                 return {
//                     id: item.id,
//                     name: item.name,
//                     code: item.code,
//                     availableQuantity: available
//                 };
//             });

//             res.json(results); // Envia a lista de itens como JSON

//         } catch (error) {
//             console.error("Error searching items:", error);
//             res.status(500).json({ error: "Erro ao buscar itens." });
//         }
//     },

//     destroy: async (req, res) => {
//         const { tenantId } = req;
//         const { id } = req.params; // Pega o ID do item da URL

//         if (!tenantId) {
//             // Redireciona para o login se o inquilino for perdido
//             return res.redirect('/login?error=Inquilino não identificado.');
//         }

//         try {
//             const sequelize = await getTenantDB(tenantId);
//             const { Item } = db.initialize(sequelize);

//             const item = await Item.findByPk(id);

//             if (item) {
//                 await item.update({ status: 'Excluido' });

//                 res.redirect('/itens?success=item_deleted');
//             } else {
//                 // 4. Trata caso o item não seja encontrado
//                 res.redirect('/itens?error=item_not_found');
//             }
//         } catch (error) {
//             console.error("Erro ao 'excluir' (soft delete) item:", error);

//             // O erro 'SequelizeForeignKeyConstraintError' não acontecerá mais aqui,
//             // mas tratamos outros erros de forma genérica.
//             res.redirect(`/itens?error=${error.message || 'delete_failed'}`);
//         }
//     }

// };

// module.exports = itemController;


// controllers/itemController.js

const { Sequelize, Op } = require('sequelize');
const { getTenantDB } = require('../config/database');
const db = require('../models');

const itemController = {

    // 📋 FORMULÁRIO DE CRIAÇÃO
    showCreateForm: (req, res) => {
        res.render('itens/novo', {
            error: null,
            formData: null,
            success: null
        });
    },

    // ➕ CRIAR ITEM
    create: async (req, res) => {
        const { tenantId } = req;
        const {
            nome, id_stock, codigo_barras, descricao,
            unidade_medida, quantidade_minima, maximumQuantity,
            loc_corredor, loc_prateleira, loc_posicao
        } = req.body;

        try {
            // Validação
            const errors = [];
            if (!nome || nome.trim().length < 2) errors.push('Nome deve ter pelo menos 2 caracteres');
            if (!id_stock) errors.push('Departamento é obrigatório');
            if (quantidade_minima < 0) errors.push('Quantidade mínima não pode ser negativa');
            if (maximumQuantity && parseFloat(maximumQuantity) < parseFloat(quantidade_minima)) {
                errors.push('Quantidade máxima não pode ser menor que a mínima');
            }

            if (errors.length > 0) {
                return res.render('itens/novo', {
                    error: errors.join(', '),
                    formData: req.body,
                    success: null
                });
            }

            const sequelize = await getTenantDB(tenantId);
            const { Item } = db.initialize(sequelize);

            // Verificar se código já existe
            if (codigo_barras) {
                const existingItem = await Item.findOne({
                    where: { code: codigo_barras, status: { [Op.in]: ['Ativo', 'Desativado'] } }
                });
                if (existingItem) {
                    return res.render('itens/novo', {
                        error: 'Código de barras já está em uso',
                        formData: req.body,
                        success: null
                    });
                }
            }

            await Item.create({
                name: nome.trim(),
                stockId: id_stock,
                code: codigo_barras || null,
                description: descricao ? descricao.trim() : null,
                unitOfMeasure: unidade_medida || 'un',
                minimumQuantity: quantidade_minima || 0,
                maximumQuantity: maximumQuantity || null,
                position: `${loc_corredor || ''}-${loc_prateleira || ''}-${loc_posicao || ''}`.replace(/-+$/g, ''),
                status: 'Ativo',
                quantity: 0
            });

            res.redirect('/itens?success=item_created');
        } catch (error) {
            console.error("Error creating item:", error);
            res.status(500).render('itens/novo', {
                error: `Erro ao criar item: ${error.message}`,
                formData: req.body,
                success: null
            });
        }
    },

    // 📊 LISTAR TODOS OS ITENS (CORRIGIDO - SEM updatedAt)
    getAll: async (req, res) => {
        const { tenantId } = req;
        const {
            busca, code, position, status, filtroStatus,
            sort, order, page = 1, limit = 50,
            quantidade_min, quantidade_max, departamentos
        } = req.query;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, Stock } = db.initialize(sequelize);

            // Construir WHERE clause
            const whereClause = {
                status: { [Op.in]: ['Ativo', 'Desativado'] }
            };

            // Filtros de texto
            if (busca) whereClause.name = { [Op.like]: `%${busca}%` };
            if (code) whereClause.code = { [Op.like]: `%${code}%` };
            if (position) whereClause.position = { [Op.like]: `%${position}%` };
            if (status && status !== 'todos') whereClause.status = status;

            // Filtro de quantidade
            if (quantidade_min || quantidade_max) {
                whereClause.quantity = {};
                if (quantidade_min) whereClause.quantity[Op.gte] = quantidade_min;
                if (quantidade_max) whereClause.quantity[Op.lte] = quantidade_max;
            }

            // Filtro de departamentos
            if (departamentos) {
                const deptArray = Array.isArray(departamentos) ? departamentos : [departamentos];
                whereClause.stockId = { [Op.in]: deptArray };
            }

            // Filtro de status de estoque
            if (filtroStatus && filtroStatus !== 'todos') {
                if (filtroStatus === 'esgotado') {
                    whereClause.quantity = { [Op.lte]: 0 };
                } else if (filtroStatus === 'baixo') {
                    whereClause.quantity = {
                        [Op.gt]: 0,
                        [Op.lt]: Sequelize.col('minimum_quantity')
                    };
                } else if (filtroStatus === 'normal') {
                    whereClause.quantity = {
                        [Op.gte]: Sequelize.col('minimum_quantity')
                    };
                }
            }

            // Ordenação
            const allowedSortColumns = ['name', 'quantity', 'code', 'description',
                'minimumQuantity', 'maximumQuantity', 'position', 'status'];
            let sortColumn = allowedSortColumns.includes(sort) ? sort : 'name';
            let sortOrder = order && ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

            // Ordenação especial para department
            let finalOrder = [[sortColumn, sortOrder]];
            if (sortColumn === 'department') {
                finalOrder = [[Sequelize.col('stock.name_stock'), sortOrder]];
            }

            // Paginação
            const currentPage = parseInt(page);
            const pageLimit = parseInt(limit);
            const offset = (currentPage - 1) * pageLimit;

            // const { count, rows: items } = await Item.findAndCountAll({
            //     where: whereClause,
            //     include: [{
            //         model: Stock,
            //         as: 'stock',
            //         attributes: []
            //     }],
            //     attributes: {
            //         exclude: ['stockId'],
            //         include: [
            //             [Sequelize.col('stock.name_stock'), 'department'],
            //             [Sequelize.literal('(quantity)'), 'availableQuantity'],
            //             // Inclua o total_value diretamente do banco
            //             [Sequelize.col('total_value'), 'totalValue']
            //         ]
            //     },
            //     order: finalOrder,
            //     limit: pageLimit,
            //     offset: offset,
            //     raw: true,
            //     nest: true
            // });

const { count, rows: items } = await Item.findAndCountAll({
    where: {
        ...whereClause,
        [Op.or]: [
            // Para os stocks específicos: quantidade > 0
            {
                '$stock.name_stock$': {
                    [Op.in]: ['Barras Cortadas', 'Chapas Cortadas']
                },
                quantity: { [Op.gt]: 0 }
            },
            // Para todos os outros stocks: sem filtro de quantidade
            {
                '$stock.name_stock$': {
                    [Op.notIn]: ['Barras Cortadas', 'Chapas Cortadas']
                }
            },
            // Para itens sem stock
            {
                '$stock.name_stock$': null
            }
        ]
    },
    include: [{
        model: Stock,
        as: 'stock',
        attributes: [],
        required: false
    }],
    attributes: {
        exclude: ['stockId'],
        include: [
            [Sequelize.col('stock.name_stock'), 'department'],
            [Sequelize.literal('(quantity)'), 'availableQuantity'],
            [Sequelize.col('total_value'), 'totalValue']
        ]
    },
    order: finalOrder,
    limit: pageLimit,
    offset: offset,
    raw: true,
    nest: true
});

            // Itens excluídos (sem paginação) - CORRIGIDO: removido updatedAt
            const excludedWhere = { status: 'Excluido' };
            if (busca) excludedWhere.name = { [Op.like]: `%${busca}%` };
            if (code) excludedWhere.code = { [Op.like]: `%${code}%` };
            if (position) excludedWhere.position = { [Op.like]: `%${position}%` };

            const excludedItems = await Item.findAll({
                where: excludedWhere,
                include: [{
                    model: Stock,
                    as: 'stock',
                    attributes: ['name']
                }],
                order: [['name', 'ASC']], // Alterado para ordenar por nome em vez de updatedAt
                raw: true,
                nest: true
            });

            // Departamentos para filtros
            const stocks = await Stock.findAll({
                order: [['name', 'ASC']]
            });

            // Calcular métricas para dashboard
            const metrics = await Promise.all([
                Item.count({ where: { status: 'Ativo' } }),
                Item.count({
                    where: {
                        quantity: { [Op.lte]: 0 },
                        status: 'Ativo'
                    }
                }),
                Item.count({
                    where: {
                        quantity: {
                            [Op.gt]: 0,
                            [Op.lt]: Sequelize.col('minimum_quantity')
                        },
                        status: 'Ativo'
                    }
                })
            ]);

            res.render('itens', {
                items,
                excludedItems,
                stocks,
                user: req.session.user,
                filters: req.query,
                currentSort: { column: sortColumn, order: sortOrder },
                pagination: {
                    currentPage,
                    totalPages: Math.ceil(count / pageLimit),
                    totalItems: count,
                    hasPrev: currentPage > 1,
                    hasNext: currentPage < Math.ceil(count / pageLimit)
                },
                metrics: {
                    totalAtivos: metrics[0],
                    totalEsgotados: metrics[1],
                    totalEstoqueBaixo: metrics[2]
                }
            });

        } catch (error) {
            console.error("Erro ao buscar itens:", error);
            // Corrigido: usando res.send em vez de res.render para view que não existe
            res.status(500).send(`Erro ao buscar itens: ${error.message}`);
        }
    },

    // 🔄 RESTAURAR ITEM
    restore: async (req, res) => {
        const { tenantId } = req;
        const { id } = req.params;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item } = db.initialize(sequelize);

            const item = await Item.findByPk(id);
            if (!item) {
                return res.redirect('/itens?error=item_not_found');
            }

            await item.update({
                status: 'Ativo',
                quantity: 0 // Reset para segurança
            });

            res.redirect('/itens?success=item_restored');
        } catch (error) {
            console.error("Erro ao restaurar item:", error);
            res.redirect(`/itens?error=restore_failed`);
        }
    },

    // ✏️ FORMULÁRIO DE EDIÇÃO
    showEditForm: async (req, res) => {
        const { tenantId } = req;
        const { id } = req.params;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, Stock } = db.initialize(sequelize);

            const item = await Item.findByPk(id, {
                include: [{ model: Stock, as: 'stock' }]
            });

            if (!item) {
                return res.status(404).send('Item não encontrado');
            }

            const stocks = await Stock.findAll({ order: [['name', 'ASC']] });

            // Parse da localização
            const positionParts = (item.position || '').split('-');
            const positionData = {
                corredor: positionParts[0] || '',
                prateleira: positionParts[1] || '',
                posicao: positionParts[2] || ''
            };

            res.render('itens/editar', {
                item: { ...item.get(), ...positionData },
                stocks,
                error: null
            });

        } catch (error) {
            console.error("Erro ao carregar formulário de edição:", error);
            res.status(500).send(`Erro ao carregar item: ${error.message}`);
        }
    },

    // 💾 ATUALIZAR ITEM
    update: async (req, res) => {
        const { tenantId } = req;
        const { id } = req.params;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, Stock } = db.initialize(sequelize);

            const item = await Item.findByPk(id);
            if (!item) {
                return res.status(404).send('Item não encontrado');
            }

            // Validação
            const errors = [];
            if (!req.body.nome || req.body.nome.trim().length < 2) {
                errors.push('Nome deve ter pelo menos 2 caracteres');
            }
            if (req.body.quantidade_minima < 0) {
                errors.push('Quantidade mínima não pode ser negativa');
            }
            if (req.body.maximumQuantity &&
                parseFloat(req.body.maximumQuantity) < parseFloat(req.body.quantidade_minima)) {
                errors.push('Quantidade máxima não pode ser menor que a mínima');
            }

            if (errors.length > 0) {
                const stocks = await Stock.findAll({ order: [['name', 'ASC']] });
                return res.render('itens/editar', {
                    item: { ...req.body, id },
                    stocks,
                    error: errors.join(', ')
                });
            }

            // Verificar código duplicado
            if (req.body.codigo_barras) {
                const existingItem = await Item.findOne({
                    where: {
                        code: req.body.codigo_barras,
                        id: { [Op.ne]: id },
                        status: { [Op.in]: ['Ativo', 'Desativado'] }
                    }
                });
                if (existingItem) {
                    const stocks = await Stock.findAll({ order: [['name', 'ASC']] });
                    return res.render('itens/editar', {
                        item: { ...req.body, id },
                        stocks,
                        error: 'Código de barras já está em uso por outro item'
                    });
                }
            }

            await item.update({
                name: req.body.nome.trim(),
                code: req.body.codigo_barras || null,
                description: req.body.descricao ? req.body.descricao.trim() : null,
                unitOfMeasure: req.body.unidade_medida || 'un',
                minimumQuantity: req.body.quantidade_minima || 0,
                maximumQuantity: req.body.maximumQuantity || null,
                stockId: req.body.id_stock,
                status: req.body.status,
                position: `${req.body.loc_corredor || ''}-${req.body.loc_prateleira || ''}-${req.body.loc_posicao || ''}`.replace(/-+$/g, '')
            });

            res.redirect('/itens?success=item_updated');
        } catch (error) {
            console.error("Erro ao atualizar item:", error);
            res.status(500).send(`Erro ao atualizar item: ${error.message}`);
        }
    },

    // 🔍 BUSCA PARA AUTOCOMPLETE (CORRIGIDO)
    searchActiveItems: async (req, res) => {
        const { tenantId } = req;
        const { q, includeStock = false } = req.query;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, Stock } = db.initialize(sequelize);

            const whereClause = { status: 'Ativo' };
            if (q) {
                whereClause[Op.or] = [
                    { name: { [Op.like]: `%${q}%` } },
                    { code: { [Op.like]: `%${q}%` } }
                ];
            }

            const include = includeStock ? [{
                model: Stock,
                as: 'stock',
                attributes: ['name']
            }] : [];

            const items = await Item.findAll({
                where: whereClause,
                include,
                limit: 20,
                order: [['name', 'ASC']],
                attributes: ['id', 'name', 'code', 'quantity', 'unitOfMeasure'] // Removido reservedQuantity
            });

            const results = items.map(item => {
                // Usando quantity direto já que não temos reservedQuantity
                const available = parseFloat(item.quantity) || 0;
                return {
                    id: item.id,
                    name: item.name,
                    code: item.code,
                    availableQuantity: available,
                    unitOfMeasure: item.unitOfMeasure,
                    department: item.stock?.name
                };
            });

            res.json(results);
        } catch (error) {
            console.error("Error searching items:", error);
            res.status(500).json({ error: "Erro ao buscar itens." });
        }
    },

    // 🗑️ EXCLUIR ITEM (SOFT DELETE)
    destroy: async (req, res) => {
        const { tenantId } = req;
        const { id } = req.params;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item } = db.initialize(sequelize);

            const item = await Item.findByPk(id);
            if (!item) {
                return res.redirect('/itens?error=item_not_found');
            }

            await item.update({
                status: 'Excluido',
                quantity: 0 // Zera a quantidade ao excluir
            });

            res.redirect('/itens?success=item_deleted');
        } catch (error) {
            console.error("Erro ao excluir item:", error);
            res.redirect(`/itens?error=delete_failed`);
        }
    },

    // 📤 EXPORTAR ITENS (CSV)
    exportItems: async (req, res) => {
        const { tenantId } = req;
        const { format = 'csv', includeHeaders = 'true' } = req.query;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, Stock } = db.initialize(sequelize);

            // Funções auxiliares de formatação
            const formatUnitOfMeasure = (unit) => {
                const units = {
                    'un': 'Unidade',
                    'cx': 'Caixa',
                    'kg': 'Quilograma',
                    'g': 'Grama',
                    'l': 'Litro',
                    'ml': 'Mililitro',
                    'm': 'Metro',
                    'cm': 'Centímetro'
                };
                return units[unit] || unit;
            };

            const formatCurrency = (value) => {
                const numValue = parseFloat(value) || 0;
                return `R$ ${numValue.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`;
            };

            const getStockStatus = (item) => {
                if (item.quantity <= 0) return '🔴 ESGOTADO';
                if (item.quantity < item.minimumQuantity) return '🟡 ESTOQUE BAIXO';
                if (item.maximumQuantity && item.quantity > item.maximumQuantity) return '🟢 ACIMA DO MÁXIMO';
                return '🟢 NORMAL';
            };

            const getStatusIcon = (status) => {
                return status === 'Ativo' ? '✅ ATIVO' : '⏸️ DESATIVADO';
            };

            // Buscar dados
            const items = await Item.findAll({
                where: {
                    status: {
                        [Op.in]: ['Ativo', 'Desativado']
                    }
                },
                include: [{
                    model: Stock,
                    as: 'stock',
                    attributes: ['name']
                }],
                order: [['name', 'ASC']],
                raw: true,
                nest: true
            });

            if (format === 'csv') {
                const timestamp = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
                const filename = `📊_RELATORIO_ESTOQUE_${timestamp}.csv`;

                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Pragma', 'no-cache');

                // BOM para Excel
                res.write('\uFEFF');

                // ===== CABEÇALHO PROFISSIONAL =====
                if (includeHeaders !== 'false') {
                    // Cabeçalho principal
                    res.write('"RELATÓRIO DE ESTOQUE - STOCKEX INVENTORY MANAGEMENT";\n');
                    res.write(`"Data de emissão: ${new Date().toLocaleString('pt-BR')}";\n`);
                    res.write('"";\n');

                    // Cabeçalho das colunas
                    const headers = [
                        '📋 ID ITEM',
                        '🏷️ NOME DO PRODUTO',
                        '📟 CÓDIGO',
                        '📝 DESCRIÇÃO',
                        '📦 QUANTIDADE ATUAL',
                        '📉 QTD. MÍNIMA',
                        '📈 QTD. MÁXIMA',
                        '🏢 DEPARTAMENTO',
                        '📍 LOCALIZAÇÃO',
                        '🔄 STATUS',
                        '⚖️ UNID. MEDIDA',
                        '💰 VALOR TOTAL',
                        '🚨 SITUAÇÃO ESTOQUE'
                    ];
                    res.write(headers.map(header => `"${header}"`).join(';') + '\n');
                }

                // ===== DADOS FORMATADOS =====
                let totalValorEstoque = 0;
                let itensComProblema = 0;

                items.forEach(item => {
                    const valorItem = parseFloat(item.totalValue) || 0;
                    totalValorEstoque += valorItem;

                    if (item.quantity <= 0 || item.quantity < item.minimumQuantity) {
                        itensComProblema++;
                    }

                    const row = [
                        // 📋 ID ITEM
                        `"${item.id}"`,

                        // 🏷️ NOME DO PRODUTO
                        `"${(item.name || 'NÃO INFORMADO').replace(/"/g, '""')}"`,

                        // 📟 CÓDIGO
                        `"${(item.code || 'SEM CÓDIGO').replace(/"/g, '""')}"`,

                        // 📝 DESCRIÇÃO
                        `"${(item.description || 'Sem descrição cadastrada').replace(/"/g, '""')}"`,

                        // 📦 QUANTIDADE ATUAL
                        item.quantity || 0,

                        // 📉 QTD. MÍNIMA
                        item.minimumQuantity || 0,

                        // 📈 QTD. MÁXIMA
                        item.maximumQuantity || 'N/D',

                        // 🏢 DEPARTAMENTO
                        `"${(item.stock?.name || 'NÃO DEFINIDO').replace(/"/g, '""')}"`,

                        // 📍 LOCALIZAÇÃO
                        `"${(item.position || 'NÃO LOCALIZADO').replace(/"/g, '""')}"`,

                        // 🔄 STATUS
                        `"${getStatusIcon(item.status)}"`,

                        // ⚖️ UNID. MEDIDA
                        `"${formatUnitOfMeasure(item.unitOfMeasure)}"`,

                        // 💰 VALOR TOTAL
                        `"${formatCurrency(item.totalValue)}"`,

                        // 🚨 SITUAÇÃO ESTOQUE
                        `"${getStockStatus(item)}"`
                    ].join(';');

                    res.write(row + '\n');
                });

                // ===== RODAPÉ COM MÉTRICAS =====
                const totalItens = items.length;
                const itensAtivos = items.filter(item => item.status === 'Ativo').length;
                const itensDesativados = items.filter(item => item.status === 'Desativado').length;
                const estoqueBaixo = items.filter(item => item.quantity > 0 && item.quantity < item.minimumQuantity).length;
                const estoqueEsgotado = items.filter(item => item.quantity <= 0).length;
                const estoqueNormal = items.filter(item =>
                    item.quantity >= item.minimumQuantity &&
                    item.quantity > 0
                ).length;

                res.write('\n');
                res.write('"📈 RESUMO ESTATÍSTICO DO ESTOQUE";""\n');
                res.write('"----------------------------------------";""\n');
                res.write(`"📊 TOTAL DE ITENS CADASTRADOS";"${totalItens}"\n`);
                res.write(`"✅ ITENS ATIVOS";"${itensAtivos}"\n`);
                res.write(`"⏸️ ITENS DESATIVADOS";"${itensDesativados}"\n`);
                res.write(`"🟢 ESTOQUE NORMAL";"${estoqueNormal}"\n`);
                res.write(`"🟡 ESTOQUE BAIXO";"${estoqueBaixo}"\n`);
                res.write(`"🔴 ESTOQUE ESGOTADO";"${estoqueEsgotado}"\n`);
                res.write(`"⚠️  ITENS COM PROBLEMAS";"${itensComProblema}"\n`);
                res.write(`"💰 VALOR TOTAL DO ESTOQUE";"${formatCurrency(totalValorEstoque)}"\n`);
                res.write('"";""\n');
                res.write('"----------------------------------------";""\n');
                res.write(`"📅 RELATÓRIO GERADO EM";"${new Date().toLocaleString('pt-BR')}"\n`);
                res.write(`"💻 SISTEMA";"StockEx Inventory Management v2.0"\n`);
                res.write(`"👤 USUÁRIO";"${req.user?.nome || 'Sistema'}"\n`);

                res.end();

            } else if (format === 'json') {
                // JSON formatado profissionalmente
                const exportData = {
                    metadata: {
                        relatorio: "Estoque Completo - StockEx",
                        dataEmissao: new Date().toISOString(),
                        dataEmissaoFormatada: new Date().toLocaleString('pt-BR'),
                        totalRegistros: items.length,
                        formato: "JSON",
                        sistema: "StockEx Inventory Management v2.0",
                        usuario: req.user?.nome || 'Sistema'
                    },
                    metricas: {
                        totalItens: items.length,
                        itensAtivos: items.filter(item => item.status === 'Ativo').length,
                        itensInativos: items.filter(item => item.status === 'Desativado').length,
                        estoqueNormal: items.filter(item => item.quantity >= item.minimumQuantity && item.quantity > 0).length,
                        estoqueBaixo: items.filter(item => item.quantity > 0 && item.quantity < item.minimumQuantity).length,
                        estoqueEsgotado: items.filter(item => item.quantity <= 0).length,
                        valorTotalEstoque: items.reduce((sum, item) => sum + (parseFloat(item.totalValue) || 0), 0)
                    },
                    itens: items.map(item => ({
                        id: item.id,
                        informacoesBasicas: {
                            nome: item.name,
                            codigo: item.code,
                            descricao: item.description,
                            unidadeMedida: formatUnitOfMeasure(item.unitOfMeasure)
                        },
                        estoque: {
                            quantidadeAtual: item.quantity,
                            quantidadeMinima: item.minimumQuantity,
                            quantidadeMaxima: item.maximumQuantity,
                            situacao: getStockStatus(item).replace(/[🔴🟡🟢]/g, '').trim()
                        },
                        localizacao: {
                            departamento: item.stock?.name,
                            posicao: item.position
                        },
                        status: {
                            situacao: item.status,
                            icone: getStatusIcon(item.status)
                        },
                        financeiro: {
                            valorTotal: parseFloat(item.totalValue) || 0,
                            valorTotalFormatado: formatCurrency(item.totalValue)
                        },
                        datas: {
                            criacao: item.createdAt,
                            atualizacao: item.updatedAt
                        }
                    }))
                };

                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="relatorio_estoque_${new Date().toISOString().split('T')[0]}.json"`);
                res.json(exportData);

            } else {
                res.status(400).json({
                    success: false,
                    error: '❌ Formato não suportado',
                    message: 'Utilize CSV ou JSON para exportação',
                    formatos_disponiveis: [
                        { formato: 'csv', descricao: 'Excel/Planilhas' },
                        { formato: 'json', descricao: 'API/Integração' }
                    ]
                });
            }

        } catch (error) {
            console.error("❌ Erro ao exportar itens:", error);

            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: '📊 Falha na geração do relatório',
                    message: 'Não foi possível processar a exportação',
                    detalhes: process.env.NODE_ENV === 'development' ? error.message : 'Contate o administrador do sistema',
                    sugestao: 'Verifique os filtros aplicados e tente novamente'
                });
            } else {
                console.error('⚠️  Headers já enviados, não é possível enviar resposta de erro');
            }
        }
    }

};

module.exports = itemController;