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

    getAll: async (req, res) => {
        const { tenantId } = req;
        const { busca, filtroStatus } = req.query;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, Stock } = db.initialize(sequelize);

            const whereClause = {};
            if (busca) {
                whereClause.name = { [Op.like]: `%${busca}%` };
            }
            if (busca) {
                whereClause.name = { [Op.like]: `%${busca}%` };
            }
            // A lógica de filtro por status agora pode ser feita diretamente no WHERE
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

            // ✅ CONSULTA CORRIGIDA AQUI
            const items = await Item.findAll({
                where: whereClause,
                include: [{
                    model: Stock,
                    as: 'stock',
                    attributes: [] // Apenas para o JOIN, não traz colunas extras
                }],
                attributes: {
                    // Seleciona todas as colunas de Item e cria a propriedade 'department'
                    include: [
                        [Sequelize.col('stock.name_stock'), 'department']
                    ]
                },
                order: [['name', 'ASC']],
                raw: true, // Importante para o alias funcionar
                nest: true   // Importante para manter a estrutura do objeto 'item'
            });

            const stocks = await Stock.findAll({ order: [['name_stock', 'ASC']] });

            // res.render('itens', { items, stocks, busca, filtroStatus, user: req.session.user });
                res.render('itens', { 
        items, 
        stocks, 
        user: req.session.user,
        query: req.query 
    });

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