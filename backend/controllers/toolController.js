

// controllers/toolController.js
const { Sequelize, Op } = require('sequelize');
const { getTenantDB } = require('../config/database');
const db = require('../models');

const toolController = {
    /**
     * Lista todas as ferramentas, separadas pelo STATUS ATUAL da ferramenta.
     * Esta é a versão com a correção do 'Duplicate column name'.
     */
    getAll: async (req, res) => {
        const { tenantId } = req;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Tool, ToolMovement, Employee } = db.initialize(sequelize);

            // 1. Buscar Ferramentas Disponíveis
            const availableTools = await Tool.findAll({
                where: { status: 'Em estoque' },
                order: [['name', 'ASC']]
            });


            // 2. Buscar Ferramentas em Uso
            const toolsInUse = await Tool.findAll({
                where: { status: 'Em uso' },
                include: [{
                    model: ToolMovement,
                    as: 'movements',
                    where: { movementType: 'Saída' },
                    include: [{ model: Employee, as: 'employee', attributes: ['name'] }],
                    // ===============================================
                    //           CORREÇÃO APLICADA AQUI 👇
                    // ===============================================
                    // A opção 'limit: 1' foi REMOVIDA para evitar o bug do SQL.
                    // A ordenação 'order' é mantida, garantindo que a
                    // movimentação mais recente seja a primeira (índice 0).
                    order: [['movementDate', 'DESC']]
                }],
                order: [['name', 'ASC']]
            });

                        // 3. Buscar Ferramentas em Manutenção (NOVO)
            const toolsInMaintenance = await Tool.findAll({
                where: { status: 'Em manutenção' },
                order: [['name', 'ASC']]
            });

            // 4. Buscar Ferramentas Desativadas (NOVO)
            const deactivatedTools = await Tool.findAll({
                where: { status: 'Desativada' },
                order: [['name', 'ASC']]
            });


            // 3. Buscar todos os funcionários para o modal de retirada
            const employees = await Employee.findAll({ order: [['name', 'ASC']] });
            // 4. Renderiza a view 'tools.ejs' com todas as variáveis corretas
            res.render('index', {
                availableTools: availableTools,
                toolsInUse: toolsInUse,
                employees: employees,
                                    toolsInMaintenance: toolsInMaintenance, // <- Nova variável
                    deactivatedTools: deactivatedTools,   // <- Nova variável
                user: req.session.user,
                query: req.query
            });
        } catch (error) {
            console.error("Error fetching tools:", error);
            res.status(500).send(`Error fetching tools: ${error.message}`);
        }
    },

    /**
     * Cria uma nova ferramenta.
     */
create: async (req, res) => {
    const { tenantId } = req;
    const { name, code } = req.body;
    
    // Validação básica
    if (!name || !code) {
        return res.redirect('/tools?error=missing_fields');
    }
    
    try {
        const sequelize = await getTenantDB(tenantId);
        const { Tool } = db.initialize(sequelize);

        // Verificar se o código já existe (opcional - para feedback mais rápido)
        const existingTool = await Tool.findOne({ where: { code } });
        if (existingTool) {
            return res.redirect('/tools?error=duplicate_code&code=' + encodeURIComponent(code));
        }

        await Tool.create({
            name: name.trim(),
            code: code.trim(),
            status: 'Em estoque'
        });

        res.redirect('/tools?success=tool_created');
    } catch (error) {
        console.error("Error creating tool:", error);
        
        // TRATAMENTO ESPECÍFICO PARA CÓDIGO DUPLICADO
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.redirect('/tools?error=duplicate_code&code=' + encodeURIComponent(code));
        }
        
        // Outros erros de validação
        if (error.name === 'SequelizeValidationError') {
            return res.redirect('/tools?error=validation_error');
        }
        
        res.redirect('/tools?error=create_failed');
    }
},

    /**
     * Registra uma RETIRADA (Saída) de ferramenta
     */
    withdraw: async (req, res) => {
        const { tenantId } = req;
        const { id: toolId } = req.params;
        const { employeeId, notes } = req.body;

        let transaction;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Tool, ToolMovement } = db.initialize(sequelize);
            transaction = await sequelize.transaction();

            const tool = await Tool.findByPk(toolId, { transaction, lock: true });
            if (!tool) throw new Error('Ferramenta não encontrada.');
            if (tool.status !== 'Em estoque') throw new Error('Esta ferramenta não está disponível para retirada.');

            await ToolMovement.create({
                toolId: tool.id,
                employeeId: employeeId,
                movementType: 'Saída',
                notes: notes,
                movementDate: new Date()
            }, { transaction });

            tool.status = 'Em uso';
            await tool.save({ transaction });

            await transaction.commit();
            res.redirect('/tools?success=tool_withdrawn');
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.error("Error withdrawing tool:", error);
            res.status(500).send(`Error: ${error.message}`);
        }
    },

    /**
     * Registra uma DEVOLUÇÃO (Retorno) de ferramenta
     */
    return: async (req, res) => {
        const { tenantId } = req;
        const { id: movementId } = req.params;

        let transaction;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Tool, ToolMovement } = db.initialize(sequelize);
            transaction = await sequelize.transaction();

            const saidaOriginal = await ToolMovement.findByPk(movementId, {
                include: [{
                    model: Tool,
                    as: 'tool',
                    lock: true
                }],
                transaction
            });

            if (!saidaOriginal) throw new Error('Movimentação de saída não encontrada.');

            const tool = saidaOriginal.tool;
            if (!tool) throw new Error('Ferramenta associada não encontrada.');
            if (tool.status !== 'Em uso') throw new Error('Esta ferramenta já está no estoque.');

            const originalEmployeeId = saidaOriginal.employeeId;

            await ToolMovement.create({
                toolId: tool.id,
                employeeId: originalEmployeeId,
                movementType: 'Retorno',
                movementDate: new Date()
            }, { transaction });

            tool.status = 'Em estoque';
            await tool.save({ transaction });

            await transaction.commit();
            res.redirect('/tools?success=tool_returned');
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.error("Error returning tool:", error);
            res.status(500).send(`Error: ${error.message}`);
        }
    },

    /**
     * "Deleta" (Desativa) uma ferramenta (Soft Delete).
     */
    destroy: async (req, res) => {
        const { tenantId } = req;
        const { id } = req.params;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Tool } = db.initialize(sequelize);

            const tool = await Tool.findByPk(id);
            if (!tool) return res.status(404).send('Tool not found.');

            tool.status = 'Excluido'; // Ou 'Desativado'
            await tool.save();

            res.redirect('/tools?success=tool_deactivated');
        } catch (error) {
            console.error("Error deactivating tool:", error);
            res.status(500).send(`Error deactivating tool: ${error.message}`);
        }
    },

    /**
     * Atualiza uma ferramenta (nome, código, status).
     */
    update: async (req, res) => {
        const { tenantId } = req;
        const { id: toolId } = req.params;
        const { name, code, status } = req.body;
        console.log(status);

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Tool } = db.initialize(sequelize);

            const tool = await Tool.findByPk(toolId);
            if (!tool) return res.status(404).send('Ferramenta não encontrada.');

            await tool.update({ name, code, status });

            res.redirect('/tools?success=tool_updated');
        } catch (error) {
            console.error("Error updating tool:", error);
            res.status(500).send(`Error updating tool: ${error.message}`);
        }
    }
};

module.exports = toolController;