
// controllers/toolController.js
const { Sequelize, Op } = require('sequelize');
const { getTenantDB } = require('../config/database');
const db = require('../models');

const toolController = {
    /**
     * Lista todas as ferramentas, separadas por 'availableTools' e 'toolsInUse'.
     */
// getAll: async (req, res) => {
//         const { tenantId } = req;
//         try {
//             const sequelize = await getTenantDB(tenantId);
//             const { Tool, ToolMovement, Employee } = db.initialize(sequelize);

//             // 1. Buscar Ferramentas Disponíveis
//             const availableTools = await Tool.findAll({
//                 where: { status: 'Em estoque' },
//                 order: [['name', 'ASC']]
//             });

//             // 2. Buscar Ferramentas em Uso
//             const toolsInUse = await Tool.findAll({
//                 where: { status: 'Em uso' },
//                 include: [{
//                     model: ToolMovement, 
//                     as: 'movements',
//                     where: { movementType: 'Saída' }, 
//                     include: [{ model: Employee, as: 'employee', attributes: ['name'] }],
//                     order: [['movementDate', 'DESC']]
//                 }],
//                 order: [['name', 'ASC']]
//             });
            
//             // 3. Buscar Ferramentas em Manutenção (NOVO)
//             const toolsInMaintenance = await Tool.findAll({
//                 where: { status: 'Em manutenção' },
//                 order: [['name', 'ASC']]
//             });

//             // 4. Buscar Ferramentas Desativadas (NOVO)
//             const deactivatedTools = await Tool.findAll({
//                 where: { status: 'Desativado' },
//                 order: [['name', 'ASC']]
//             });

//             // 5. Buscar todos os funcionários para o modal de retirada
//             const employees = await Employee.findAll({ order: [['name', 'ASC']] });
            
//             // 6. Renderiza a view 'tools.ejs' com TODAS as variáveis
//             res.render('index', { 
//                 availableTools: availableTools,
//                 toolsInUse: toolsInUse,
//                 toolsInMaintenance: toolsInMaintenance, // <- Nova variável
//                 deactivatedTools: deactivatedTools,   // <- Nova variável
//                 employees: employees,
//                 user: req.session.user, 
//                 query: req.query 
//             });
//         } catch (error) {
//             console.error("Error fetching tools:", error);
//             res.status(500).send(`Error fetching tools: ${error.message}`);
//         }
//     },
getAll: async (req, res) => {
        // ... (Sua função getAll existente, que já separa as ferramentas, está correta)
        const { tenantId } = req;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Tool, ToolMovement, Employee } = db.initialize(sequelize);

            const availableTools = await Tool.findAll({ where: { status: 'Em estoque' }, order: [['name', 'ASC']] });
            const toolsInUse = await Tool.findAll({
                where: { status: 'Em uso' },
                include: [{
                    model: ToolMovement, 
                    as: 'movements',
                    where: { movementType: 'Saída' }, 
                    include: [{ model: Employee, as: 'employee', attributes: ['name'] }],
                    order: [['movementDate', 'DESC']],
                    limit: 1
                }],
                order: [['name', 'ASC']]
            });
            const toolsInMaintenance = await Tool.findAll({ where: { status: 'Em manutenção' }, order: [['name', 'ASC']] });
            const deactivatedTools = await Tool.findAll({ where: { status: 'Desativado' }, order: [['name', 'ASC']] });
            const employees = await Employee.findAll({ order: [['name', 'ASC']] });
            
            res.render('index', { 
                availableTools,
                toolsInUse,
                toolsInMaintenance,
                deactivatedTools,
                employees,
                user: req.session.user, 
                query: req.query 
            });
        } catch (error) {
            console.error("Error fetching tools:", error);
            res.status(500).send(`Error fetching tools: ${error.message}`);
        }
    },
destroy: async (req, res) => {
        const { tenantId } = req;
        const { id } = req.params;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Tool } = db.initialize(sequelize);

            const tool = await Tool.findByPk(id);
            if (!tool) {
                return res.status(404).send('Tool not found.');
            }

            // ===============================================
            //           MUDANÇA APLICADA AQUI 👇
            // ===============================================
            // Não deletamos, apenas mudamos o status para 'Excluido'.
            tool.status = 'Excluido'; // <-- Alterado de 'Desativado'
            await tool.save(); 
            // ===============================================

            res.redirect('/tools?success=tool_excluded');

        } catch (error) {
            console.error("Error deactivating tool:", error);
            res.status(500).send(`Error deactivating tool: ${error.message}`);
        }
    },

    /**
     * Cria uma nova ferramenta.
     */
    create: async (req, res) => {
        const { tenantId } = req;
        const { name, code } = req.body; 
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Tool } = db.initialize(sequelize);
            
            await Tool.create({ name, code, status: 'Em estoque' });

            res.redirect('/tools?success=tool_created');
        } catch (error) {
            console.error("Error creating tool:", error);
            res.status(500).send(`Error creating tool: ${error.message}`);
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

    update: async (req, res) => {
        const { tenantId } = req;
        const { id: toolId } = req.params;
        // Pega os dados do formulário de edição
        const { name, code, status } = req.body; 

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Tool } = db.initialize(sequelize);

            const tool = await Tool.findByPk(toolId);
            if (!tool) {
                return res.status(404).send('Ferramenta não encontrada.');
            }

            // Atualiza a ferramenta com os novos dados
            await tool.update({
                name: name,
                code: code,
                status: status // Atualiza o status para 'Desativado' ou qualquer outro
            });

            res.redirect('/tools?success=tool_updated');

        } catch (error) {
            console.error("Error updating tool:", error);
            res.status(500).send(`Error updating tool: ${error.message}`);
        }
    },

    /**
     * Registra uma DEVOLUÇÃO (Retorno) de ferramenta
     */
return: async (req, res) => {
        const { tenantId } = req;
        const { id: movementId } = req.params; // ID da *movimentação de saída* original

        let transaction;
        try {
            const sequelize = await getTenantDB(tenantId);
            // Precisamos dos modelos Tool e ToolMovement
            const { Tool, ToolMovement } = db.initialize(sequelize);
            transaction = await sequelize.transaction();

            // ===============================================
            //           MUDANÇA APLICADA AQUI 👇
            // ===============================================
            // 1. Encontra a movimentação de SAÍDA original e JÁ INCLUI
            //    a ferramenta ('tool') associada, travando-a para a transação.
            const saidaOriginal = await ToolMovement.findByPk(movementId, {
                include: [{
                    model: Tool,
                    as: 'tool',
                    lock: true // Trava a linha da ferramenta para a atualização
                }],
                transaction
            });
            // ===============================================

            // 2. Verifica se a movimentação e a ferramenta foram encontradas
            if (!saidaOriginal) {
                throw new Error('Movimentação de saída não encontrada.');
            }

            const tool = saidaOriginal.tool; // Acessa a ferramenta do 'include'
            
            if (!tool) {
                // Isso não deve acontecer se a chave estrangeira estiver correta
                throw new Error('Ferramenta associada não encontrada.');
            }
            if (tool.status !== 'Em uso') {
                throw new Error('Esta ferramenta já está no estoque.');
            }

            // 3. Pega o ID do funcionário da SAÍDA ORIGINAL (como você queria)
            const originalEmployeeId = saidaOriginal.employeeId;

            // 4. Cria o registro de RETORNO
            await ToolMovement.create({
                toolId: tool.id,
                employeeId: originalEmployeeId,
                movementType: 'Retorno',
                movementDate: new Date()
            }, { transaction });

            // 5. Atualiza o status da ferramenta
            tool.status = 'Em estoque';
            await tool.save({ transaction });

            await transaction.commit();
            res.redirect('/tools?success=tool_returned');
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.error("Error returning tool:", error);
            res.status(500).send(`Error: ${error.message}`);
        }
    }

};

module.exports = toolController;