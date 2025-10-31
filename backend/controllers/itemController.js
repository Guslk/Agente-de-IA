// controllers/itemController.js

const { Sequelize, Op } = require('sequelize');
const { getTenantDB } = require('../config/database');
const db = require('../models');

const itemController = {

    showCreateForm: (req, res) => {
        res.render('itens/novo', { error: null });
    },

    create: async (req, res) => {
        const { tenantId } = req;
        // Recebe os nomes corretos do formulário .ejs
        const { nome, id_stock, codigo_barras, descricao, unidade_medida, quantidade_minima, loc_corredor, loc_prateleira, loc_posicao, maximumQuantity } = req.body;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item } = db.initialize(sequelize);

            await Item.create({
                name: nome,
                stockId: id_stock,
                code: codigo_barras,
                description: descricao,
                unitOfMeasure: unidade_medida,
                minimumQuantity: quantidade_minima,
                maximumQuantity: maximumQuantity,
                position: `${loc_corredor}-${loc_prateleira}-${loc_posicao}`
            });
            res.redirect('/itens?success=item_created');
        } catch (error) {
            console.error("Error creating item:", error);
            res.status(500).send(`Error creating item: ${error.message}`);
        }
    },

    getAll: async (req, res) => {
        const { tenantId } = req;
        // 1. Captura TODOS os filtros e parâmetros de ordenação
        const {
            busca,       // Busca por Nome
            code,        // Busca por Código
            position,    // Busca por Localização
            status,      // Filtro de Status (Ativo, Desativado)
            filtroStatus, // Filtro de Estoque (Baixo, Normal, Esgotado)
            sort,
            order
        } = req.query;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, Stock } = db.initialize(sequelize);

            // --- 2. Lógica de Filtro (Where) ---

            // Filtro principal: Itens Ativos e Desativados (a Lixeira é separada)
            const whereClause = {
                status: { [Op.in]: ['Ativo', 'Desativado'] }
            };

            // Adiciona filtros em cadeia
            if (busca && busca !== "") {
                whereClause.name = { [Op.like]: `%${busca}%` };
            }
            if (code && code !== "") {
                whereClause.code = { [Op.like]: `%${code}%` };
            }
            if (position && position !== "") {
                whereClause.position = { [Op.like]: `%${position}%` };
            }
            if (status && status !== 'todos') {
                whereClause.status = status; // Filtra por Ativo ou Desativado
            }

            // Adiciona o filtro de status de ESTOQUE
            if (filtroStatus && filtroStatus !== 'todos') {
                if (filtroStatus === 'esgotado') {
                    whereClause.quantity = { [Op.lte]: 0 };
                } else if (filtroStatus === 'baixo') {
                    whereClause.quantity = {
                        [Op.gt]: 0,
                        [Op.lt]: Sequelize.col('minimum_quantity')
                    };
                } else if (filtroStatus === 'normal') {
                    whereClause.quantity = { [Op.gte]: Sequelize.col('minimum_quantity') };
                }
            }

            // --- 3. Lógica de Ordenação ---
            const allowedSortColumns = ['name', 'quantity', 'department', 'position', 'status', 'code', 'description', 'minimumQuantity', 'maximumQuantity'];
            let sortColumn = sort || 'name'; // Padrão é ordenar por nome
            let sortOrder = order && ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

            if (!allowedSortColumns.includes(sortColumn)) {
                sortColumn = 'name';
            }

            // A ordenação por 'department' funciona por causa do alias [Sequelize.col('stock.name_stock'), 'department']
            const finalOrder = [[sortColumn, sortOrder]];

            // --- 4. Busca de Dados ---
            const items = await Item.findAll({
                where: whereClause,
                include: [{
                    model: Stock,
                    as: 'stock',
                    attributes: []
                }],
                attributes: {
                    // Seleciona todas as colunas de Item
                    // (O 'field' no modelo cuida dos nomes como 'minimum_quantity')
                    exclude: ['stockId'],
                    include: [
                        [Sequelize.col('stock.name_stock'), 'department']
                    ]
                },
                order: finalOrder, // <-- Aplica a ordenação dinâmica
                raw: true,
                nest: true
            });

            // Busca a Lixeira (com filtros de busca, mas sem filtro de status de estoque)
            const excludedWhere = { status: 'Excluido' };
            if (busca) excludedWhere.name = { [Op.like]: `%${busca}%` };
            if (code) excludedWhere.code = { [Op.like]: `%${code}%` };
            if (position) excludedWhere.position = { [Op.like]: `%${position}%` };

            const excludedItems = await Item.findAll({
                where: excludedWhere,
                include: [{ model: Stock, as: 'stock', attributes: ['name'] }],
                order: [['name', 'ASC']],
                raw: true, // Adicionado para consistência
                nest: true  // Adicionado para consistência
            });

            // Busca Estoques para os modais
            const stocks = await Stock.findAll({ order: [['name', 'ASC']] });

            // 5. Renderiza a view com TODOS os dados
            res.render('itens', { // Ou 'index.ejs'
                items: items,
                excludedItems: excludedItems,
                stocks: stocks,
                user: req.session.user,
                query: req.query,
                filters: req.query, // Passa todos os filtros de volta
                currentSort: { column: sortColumn, order: sortOrder } // Passa a ordenação atual
            });

        } catch (error) {
            console.error("Erro ao buscar itens:", error);
            res.status(500).send(`Erro ao buscar itens: ${error.message}`);
        }
    },

    // restore: async (req, res) => {
    //     const { tenantId } = req;
    //     const { id } = req.params; // Pega o ID do item da URL

    //     try {
    //         const sequelize = await getTenantDB(tenantId);
    //         const { Item } = db.initialize(sequelize);

    //         const item = await Item.findByPk(id);

    //         if (item) {
    //             // Apenas muda o status de volta para 'Ativo'
    //             await item.update({ status: 'Ativo' });

    //             res.redirect('/itens?success=item_restored');
    //         } else {
    //             res.redirect('/itens?error=item_not_found');
    //         }
    //     } catch (error) {
    //         console.error("Erro ao restaurar item:", error);
    //         res.redirect(`/itens?error=${error.message || 'restore_failed'}`);
    //     }
    // },

    restore: async (req, res) => {
        const { tenantId } = req;
        const { id } = req.params;
        let wasReassigned = false; // Flag para saber se o item foi realocado

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, Stock } = db.initialize(sequelize);

            const item = await Item.findByPk(id);

            if (item) {

                let originalStockExists = true; // Assume que existe

                if (item.stockId) { // Verifica se o item tinha um departamento
                    const stock = await Stock.findByPk(item.stockId);

                    // Se o departamento não existe (foi deletado)
                    if (!stock || stock.status === 'Excluido') {
                        originalStockExists = false;
                        wasReassigned = true; // Marca que uma realocação é necessária

                        console.warn(`Item ${id} está órfão. Departamento ${item.stockId} não existe. Buscando substituto...`);

                        // 1. Encontra o 'stockId' mais usado por outros itens ATIVOS
                        const mostUsedStock = await Item.findOne({
                            attributes: [
                                'stockId',
                                [sequelize.fn('COUNT', sequelize.col('stockId')), 'count']
                            ],
                            where: {
                                stockId: { [Op.ne]: null },
                                status: 'Ativo' // Conta apenas entre itens ativos
                            },
                            include: [{
                                model: Stock,
                                as: 'stock',
                                attributes: [],
                                where: { status: 'Ativo' } // Garante que o departamento de destino esteja ativo
                            }],
                            group: ['stockId'],
                            order: [[sequelize.fn('COUNT', sequelize.col('stockId')), 'DESC']],
                            raw: true
                        });

                        if (mostUsedStock) {
                            // 2. Atribui o item ao departamento mais usado
                            item.stockId = mostUsedStock.stockId;
                        } else {
                            // 3. Se NENHUM item tiver departamento (raro), define como nulo
                            item.stockId = null;
                        }
                    }
                }

                // Seta o status para 'Ativo'
                item.status = 'Ativo';
                // Salva as alterações (novo status e/ou novo stockId)
                await item.save();

                // Decide qual mensagem de sucesso enviar
                if (wasReassigned) {
                    res.redirect('/itens?success=item_restored_reassigned');
                } else {
                    res.redirect('/itens?success=item_restored');
                }

            } else {
                res.redirect('/itens?error=item_not_found');
            }
        } catch (error) {
            // Conflito de Duplicidade (ex: código de item já existe)
            if (error.name === 'SequelizeUniqueConstraintError') {
                console.warn(`Conflito de restauração: Item ${id} tem código/nome duplicado.`);
                return res.redirect('/itens?error=restore_failed_duplicate');
            }
            console.error("Erro ao restaurar item:", error);
            res.redirect(`/itens?error=${error.message || 'restore_failed'}`);
        }
    },

    showEditForm: async (req, res) => {
        const { tenantId } = req;
        if (!tenantId) return res.status(400).send("Erro: Inquilino não identificado.");

        try {
            const sequelize = await getTenantDB(tenantId);
            // Chama o método 'initialize' para obter os modelos
            const { Item } = db.initialize(sequelize);

            const item = await Item.findByPk(req.params.id);
            if (item) {
                res.render('itens/editar', { item, error: null });
            } else {
                res.status(404).send('Item não encontrado.');
            }
        } catch (error) {
            res.status(500).send(`Erro ao buscar item: ${error.message}`);
        }
    },
    update: async (req, res) => {
        const { tenantId } = req;
        const { id } = req.params;
        // 1. Recebe todos os campos do modal de edição
        const { 
            nome, id_stock, codigo_barras, descricao, unidade_medida, 
            quantidade_minima, maximumQuantity, status, // <- Novos campos
            loc_corredor, loc_prateleira, loc_posicao 
        } = req.body;
        
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item } = db.initialize(sequelize);

            const item = await Item.findByPk(id);
            if (!item) {
                return res.redirect(`/itens?error=item_not_found`);
            }

            // 2. Atualiza o item com os dados do formulário
            await item.update({
                name: nome,
                stockId: id_stock,
                code: codigo_barras,
                description: descricao,
                unitOfMeasure: unidade_medida,
                minimumQuantity: quantidade_minima,
                maximumQuantity: maximumQuantity || null,
                status: status, // Permite alterar o status (ex: para 'Desativado')
                position: `${loc_corredor}-${loc_prateleira}-${loc_posicao}`
            });
            
            res.redirect('/itens?success=item_updated');
        } catch (error) {
            console.error("Error updating item:", error);
            res.redirect(`/itens?error=${error.message || 'update_failed'}`);
        }
    },
    // update: async (req, res) => {
    //     const { tenantId } = req;
    //     const { id } = req.params; // Pega o ID do item da URL

    //     if (!tenantId) return res.status(400).send("Erro: Inquilino não identificado.");

    //     try {
    //         const sequelize = await getTenantDB(tenantId);
    //         const { Item } = db.initialize(sequelize);

    //         // 1. Encontra o item que será atualizado
    //         const item = await Item.findByPk(id);

    //         if (item) {
    //             // 2. Monta o objeto com os dados atualizados do formulário
    //             const dadosAtualizados = {
    //                 name: req.body.nome,
    //                 code: req.body.codigo_barras,
    //                 description: req.body.descricao,
    //                 unitOfMeasure: req.body.unidade_medida,
    //                 minimumQuantity: req.body.quantidade_minima,
    //                 id_stock: req.body.id_stock, // Atualiza o estoque
    //                 maximumQuantity: req.body.maximumQuantity,
    //                 status: req.body.status,
    //                 position: `${req.body.loc_corredor}-${req.body.loc_prateleira}-${req.body.loc_posicao}`
    //             };

    //             // 3. Salva as alterações no banco de dados
    //             await item.update(dadosAtualizados);

    //             // 4. Redireciona de volta para a lista de itens
    //             res.redirect('/itens?sucesso=item_atualizado');
    //         } else {
    //             res.status(404).send('Item não encontrado para atualizar.');
    //         }
    //     } catch (error) {
    //         console.error("Erro ao atualizar item:", error);
    //         res.status(500).send(`Erro ao atualizar item: ${error.message}`);
    //     }
    // },
    destroy: async (req, res) => {
        const { tenantId } = req;
        const { id } = req.params;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item } = db.initialize(sequelize);

            const item = await Item.findByPk(id);
            if (item) {
                // 1. Verifica se o item já tem movimentações (opcional, mas recomendado)
                // Se você tiver um modelo 'Movement', pode verificar aqui.
                // Por enquanto, apenas atualizamos o status.
                
                // 2. Muda o status para 'Excluido'
                await item.update({ status: 'Excluido' });
                
                res.redirect('/itens?success=item_deleted');
            } else {
                res.redirect('/itens?error=item_not_found');
            }
        } catch (error) {
            // Este erro (ForeignKey) não deve acontecer com soft delete,
            // mas é bom mantê-lo por segurança caso a lógica mude.
            console.error("Erro ao 'excluir' (soft delete) item:", error);
            if (error.name === 'SequelizeForeignKeyConstraintError') {
                return res.redirect('/itens?error=item_in_use');
            }
            res.redirect(`/itens?error=${error.message || 'delete_failed'}`);
        }
    }
    // destroy: async (req, res) => {
    //     const { tenantId } = req;
    //     const { id } = req.params; // Pega o ID do item da URL

    //     if (!tenantId) {
    //         // Redireciona para o login se o inquilino for perdido
    //         return res.redirect('/login?error=Inquilino não identificado.');
    //     }

    //     try {
    //         const sequelize = await getTenantDB(tenantId);
    //         const { Item } = db.initialize(sequelize);

    //         const item = await Item.findByPk(id);

    //         if (item) {
    //             await item.update({ status: 'Excluido' });

    //             res.redirect('/itens?success=item_deleted');
    //         } else {
    //             // 4. Trata caso o item não seja encontrado
    //             res.redirect('/itens?error=item_not_found');
    //         }
    //     } catch (error) {
    //         console.error("Erro ao 'excluir' (soft delete) item:", error);

    //         // O erro 'SequelizeForeignKeyConstraintError' não acontecerá mais aqui,
    //         // mas tratamos outros erros de forma genérica.
    //         res.redirect(`/itens?error=${error.message || 'delete_failed'}`);
    //     }
    // }

};

module.exports = itemController;