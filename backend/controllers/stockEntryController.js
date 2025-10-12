// =============================================================================
// CONTROLLER DE MOVIMENTAÇÃO DE ESTOQUE (ENTRADAS/SAÍDAS)
// =============================================================================

const { getTenantDB } = require('../config/database');
const initializeModels = require('../models'); // Nosso gerenciador de modelos

const stockEntryController = {

    /**
     * Exibe o formulário para adicionar uma nova movimentação (entrada/saída)
     * para um item específico.
     */
    showEntryForm: async (req, res) => {
        // #swagger.tags = ['StockEntries']
        const { tenantId } = req;
        const { itemId } = req.params; // O ID do item vem da URL, ex: /items/123/entries/add

        if (!tenantId) {
            return res.status(400).send("Erro: Inquilino não identificado.");
        }

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item } = initializeModels(sequelize);
            
            // Busca o item para mostrar seu nome no formulário
            const item = await Item.findByPk(itemId);
            
            if (!item) {
                return res.status(404).send("Item não encontrado.");
            }

            res.render('stock_entries/new', { item }); // Ex: views/stock_entries/new.ejs

        } catch (error) {
            console.error("Erro ao exibir formulário de entrada:", error);
            res.status(500).send("Erro ao carregar a página.");
        }
    },

    /**
     * Cria uma nova movimentação de estoque (entrada ou saída).
     */
    create: async (req, res) => {
        // #swagger.tags = ['StockEntries']
        const { tenantId } = req;
        const { itemId } = req.params;

        if (!tenantId) {
            return res.status(400).send("Erro: Inquilino não identificado.");
        }

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, StockEntry } = initializeModels(sequelize);

            // Validação: Verifica se o item ao qual estamos adicionando estoque realmente existe
            const item = await Item.findByPk(itemId);
            if (!item) {
                return res.status(404).send("Item não encontrado. Não é possível adicionar a entrada de estoque.");
            }

            // Lógica para Entrada vs. Saída
            // O formulário deve enviar um campo 'movementType' ('entry' ou 'exit')
            const quantity = parseInt(req.body.quantity, 10);
            const movementType = req.body.movementType; // Ex: 'entry' ou 'exit'
            
            // Se for uma saída, a quantidade se torna negativa.
            const finalQuantity = (movementType === 'exit') ? -Math.abs(quantity) : Math.abs(quantity);

            const entryData = {
                itemId: itemId, // Chave estrangeira
                quantity: finalQuantity,
                unitPrice: req.body.unitPrice,
                invoiceNumber: req.body.invoiceNumber,
                purchaseOrder: req.body.purchaseOrder,
                batch: req.body.batch,
                movementDate: req.body.movementDate || new Date() // Usa a data do form ou a atual
            };

            await StockEntry.create(entryData);

            // Redireciona para uma página de sucesso ou para os detalhes do item
            res.redirect(`/itens/${itemId}/details?sucesso=movimentacao_criada`);

        } catch (error) {
            console.error("Erro ao criar movimentação de estoque:", error);
            res.status(500).send(`Erro ao salvar a movimentação: ${error.message}`);
        }
    },

    /**
     * Lista todas as movimentações de um item específico.
     */
    listByItem: async (req, res) => {
        // #swagger.tags = ['StockEntries']
        const { tenantId } = req;
        const { itemId } = req.params;

        if (!tenantId) {
            return res.status(400).send("Erro: Inquilino não identificado.");
        }
        
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, StockEntry } = initializeModels(sequelize);

            // Busca o item para exibir suas informações na página
            const item = await Item.findByPk(itemId);
            if (!item) {
                return res.status(404).send("Item não encontrado.");
            }

            // Busca todas as entradas associadas a este item, ordenadas pela mais recente
            const entries = await StockEntry.findAll({
                where: { itemId: itemId },
                order: [['movementDate', 'DESC']]
            });
            
            // Renderiza uma página de detalhes do item com seu histórico de movimentações
            res.render('itens/details', { item, entries }); // Ex: views/itens/details.ejs

        } catch (error) {
            console.error("Erro ao listar movimentações do item:", error);
            res.status(500).send("Erro ao buscar histórico do item.");
        }
    }
};

module.exports = stockEntryController;