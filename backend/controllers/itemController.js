// controllers/itemController.js

// =============================================================================
// CONTROLLER DE ITENS (CRUD COMPLETO)
// Ajustado para funcionar com o seu `models/index.js`
// =============================================================================
const { Sequelize, Op } = require('sequelize');
const { getTenantDB } = require('../config/database');
const db = require('../models');

const itemController = {

    showCreateForm: (req, res) => {
        res.render('itens/novo', { error: null });
    },

    create: async (req, res) => {
        const { tenantId } = req;
        if (!tenantId) return res.status(400).send("Erro: Inquilino não identificado.");

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item } = db.initialize(sequelize);

            // Mapeia todos os campos do seu novo formulário
            const dadosItem = {
                name: req.body.nome,
                id_stock: req.body.id_stock,
                code: req.body.codigo_barras,
                description: req.body.descricao,
                unitOfMeasure: req.body.unidade_medida,
                minimumQuantity: req.body.quantidade_minima,  // Novo campo
                position: `${req.body.loc_corredor}-${req.body.loc_prateleira}-${req.body.loc_posicao}`
            };

            // Cria apenas o item, sem transação ou entrada de estoque
            await Item.create(dadosItem);

            res.redirect('/itens?sucesso=item_criado');

        } catch (error) {
            console.error("Erro ao cadastrar item:", error);
            // Idealmente, renderiza a página de novo com os dados e o erro
            res.status(500).send(`Erro ao salvar o item: ${error.message}`);
        }
    },

    // getAll: async (req, res) => {
    //     const { tenantId } = req;
    //     if (!tenantId) {
    //         return res.status(400).send("Erro: Inquilino não identificado.");
    //     }

    //     try {
    //         const sequelize = await getTenantDB(tenantId);
    //         // Garante a importação do objeto Sequelize para usar as funções
    //         const { Sequelize } = require('sequelize');
    //         const { Item, Stock } = db.initialize(sequelize);

    //         const items = await Item.findAll({
    //             attributes: [
    //                 [Sequelize.col('Item.id_item'), 'id'],
    //                 'name', 'description', 'position', 'code', 'unitOfMeasure', 'minimumQuantity',
    //                 // ======================================================
    //                 //             CORREÇÃO APLICADA AQUI
    //                 // ======================================================
    //                 // Pede pela coluna real 'name_stock' da tabela associada 'stock'
    //                 [Sequelize.col('stock.name_stock'), 'department']
    //             ],
    //             include: [
    //                 // { model: StockEntry, as: 'entries', attributes: [], required: false },
    //                 { model: Stock, as: 'stock', attributes: [] }
    //             ],
    //             group: [
    //                 'Item.id_item',
    //                 'Item.name',
    //                 'Item.description',
    //                 'Item.position',
    //                 'Item.code',
    //                 'Item.unit_of_measure',
    //                 'Item.minimum_quantity',
    //                 'stock.name_stock' // Agrupa pela coluna real
    //                 // ======================================================
    //             ],
    //             order: [['name', 'ASC']],
    //             raw: true
    //         });

    //         const stocks = await Stock.findAll({ order: [['name_stock', 'ASC']] });

    //         // 5. Chamada de renderização simplificada
    //         res.render('itens', { items, stocks, query: req.query });

    //     } catch (error) {
    //         console.error("Erro ao buscar itens:", error);
    //         res.status(500).send(`Erro ao buscar itens: ${error.message}`);
    //     }
    // },
        getAll: async (req, res) => {
        const { tenantId } = req;
        // Pega os parâmetros de filtro da URL (ex: /itens?busca=parafuso&filtroStatus=baixo)
        const { busca, filtroStatus } = req.query;

        if (!tenantId) {
            return res.status(400).send("Erro: Inquilino não identificado.");
        }

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, StockEntry, Stock } = db.initialize(sequelize);

            // ======================================================
            //      LÓGICA DE FILTRO DINÂMICO ⚙️
            // ======================================================
            const whereClause = {};
            const havingClause = {};

            // 1. Filtro por nome do item (LIKE)
            if (busca) {
                whereClause.name = {
                    [Op.like]: `%${busca}%`
                };
            }

            // 2. Filtro por status do estoque (HAVING)
            if (filtroStatus && filtroStatus !== 'todos') {
                // const qtdAtualColumn = Sequelize.fn('SUM', Sequelize.col('entries.quantity'));

                switch (filtroStatus) {
                    case 'esgotado':
                        // Considera nulo (sem movimentação) ou soma <= 0
                        havingClause[Op.or] = [
                            Sequelize.where(qtdAtualColumn, Op.is, null),
                            Sequelize.where(qtdAtualColumn, Op.lte, 0)
                        ];
                        break;
                    case 'baixo':
                        // Quantidade atual é maior que 0, mas menor que a quantidade mínima
                        havingClause[Op.and] = [
                            Sequelize.where(qtdAtualColumn, Op.gt, 0),
                            Sequelize.where(qtdAtualColumn, Op.lt, Sequelize.col('Item.minimumQuantity'))
                        ];
                        break;
                    case 'normal':
                        // Quantidade atual é maior ou igual à quantidade mínima
                        havingClause[Op.gte] = Sequelize.where(qtdAtualColumn, Op.gte, Sequelize.col('Item.minimumQuantity'));
                        break;
                }
            }
            // ======================================================

            const items = await Item.findAll({
                attributes: [
                    [Sequelize.col('Item.id_item'), 'id'],
                    'name', 'description', 'position', 'code', 'unitOfMeasure', 'minimumQuantity',
                    // [Sequelize.fn('SUM', Sequelize.col('entries.quantity')), 'quantidade_atual'],
                    [Sequelize.col('name_stock'), 'department']
                ],
                include: [
                    { model: Stock, as: 'stock', attributes: [], required: false } // 'required: false' para LEFT JOIN
                ],
                where: whereClause,    // Aplica o filtro de nome aqui
                having: havingClause,  // Aplica o filtro de status aqui
                // group: ['Item.id_item', 'stock_name'],
                order: [['name', 'ASC']],
                raw: true,
                subQuery: false // Importante para que o LEFT JOIN funcione corretamente com o WHERE
            });
            
            const stocks = await Stock.findAll({ order: [['name_stock', 'ASC']] });

            // Envia os filtros de volta para a view para manter os campos preenchidos
            res.render('itens', { items, stocks, busca, filtroStatus });

        } catch (error) {
            console.error("Erro ao buscar itens:", error);
            res.status(500).send(`Erro ao buscar itens: ${error.message}`);
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
        const { id } = req.params; // Pega o ID do item da URL

        if (!tenantId) return res.status(400).send("Erro: Inquilino não identificado.");

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item } = db.initialize(sequelize);

            // 1. Encontra o item que será atualizado
            const item = await Item.findByPk(id);

            if (item) {
                // 2. Monta o objeto com os dados atualizados do formulário
                const dadosAtualizados = {
                    name: req.body.nome,
                    code: req.body.codigo_barras,
                    description: req.body.descricao,
                    unitOfMeasure: req.body.unidade_medida,
                    minimumQuantity: req.body.quantidade_minima,
                    id_stock: req.body.id_stock, // Atualiza o estoque
                    // Junta as 3 partes da localização em uma única string
                    position: `${req.body.loc_corredor}-${req.body.loc_prateleira}-${req.body.loc_posicao}`
                };

                // 3. Salva as alterações no banco de dados
                await item.update(dadosAtualizados);
                
                // 4. Redireciona de volta para a lista de itens
                res.redirect('/itens?sucesso=item_atualizado');
            } else {
                res.status(404).send('Item não encontrado para atualizar.');
            }
        } catch (error) {
            console.error("Erro ao atualizar item:", error);
           res.status(500).send(`Erro ao atualizar item: ${error.message}`);
        }
    },


    destroy: async (req, res) => {
        const { tenantId } = req;
        if (!tenantId) return res.status(400).send("Erro: Inquilino não identificado.");

        try {
            const sequelize = await getTenantDB(tenantId);
            // Chama o método 'initialize' para obter os modelos
            const { Item } = db.initialize(sequelize);

            const item = await Item.findByPk(req.params.id);
            if (item) {
                await item.destroy();
                res.redirect('/itens?sucesso=item_deletado');
            } else {
                res.status(404).send('Item não encontrado para deletar.');
            }
        } catch (error) {
            console.error("Erro ao deletar item:", error);
            if (error.name === 'SequelizeForeignKeyConstraintError') {
                return res.status(400).send('Não é possível deletar este item, pois ele possui movimentações de estoque associadas.');
            }
            res.status(500).send(`Erro ao deletar item: ${error.message}`);
        }
    }

};

module.exports = itemController;