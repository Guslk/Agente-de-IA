// // // controllers/toolHistoryController.js
// // const { Sequelize, Op } = require('sequelize'); // Importamos o Op para os filtros
// // const { getTenantDB } = require('../config/database');
// // const db = require('../models');

// // const toolHistoryController = {
// //     /**
// //      * Lista TODO o histórico de movimentações com filtros dinâmicos.
// //      */
// //     getAll: async (req, res) => {
// //         const { tenantId } = req;
// //         // 1. Captura todos os filtros possíveis da URL (req.query)
// //         const { toolId, employeeId, movementType, startDate, endDate } = req.query;

// //         try {
// //             const sequelize = await getTenantDB(tenantId);
// //             const { Tool, ToolMovement, Employee } = db.initialize(sequelize);

// //             // --- 2. Constrói a Cláusula 'where' Dinamicamente ---
// //             const whereClause = {};

// //             if (toolId) {
// //                 whereClause.toolId = toolId;
// //             }
// //             if (employeeId) {
// //                 whereClause.employeeId = employeeId;
// //             }
// //             if (movementType) {
// //                 whereClause.movementType = movementType;
// //             }
// //             // Filtro de data (range)
// //             if (startDate && endDate) {
// //                 whereClause.movementDate = { [Op.between]: [new Date(startDate), new Date(endDate)] };
// //             } else if (startDate) {
// //                 whereClause.movementDate = { [Op.gte]: new Date(startDate) }; // Maior ou igual
// //             } else if (endDate) {
// //                 whereClause.movementDate = { [Op.lte]: new Date(endDate) }; // Menor ou igual
// //             }
// //             // --- Fim da construção do 'where' ---

// //             // 3. Busca as movimentações filtradas, incluindo as tabelas associadas
// //             const movements = await ToolMovement.findAll({
// //                 where: whereClause,
// //                 include: [
// //                     { model: Tool, as: 'tool', attributes: ['name', 'code'] },
// //                     { model: Employee, as: 'employee', attributes: ['name'] }
// //                 ],
// //                 order: [['movementDate', 'DESC']]
// //             });

// //             // 4. Busca os dados para preencher os dropdowns de filtro
// //             const allTools = await Tool.findAll({ order: [['name', 'ASC']] });
// //             const allEmployees = await Employee.findAll({ order: [['name', 'ASC']] });

// //             // 5. Renderiza a nova view, passando todos os dados
// //             res.render('tool-history', {
// //                 movements,
// //                 allTools,
// //                 allEmployees,
// //                 filters: req.query, // Envia os filtros de volta para a view
// //                 user: req.session.user,
// //                 paginaAtiva: 'tool-history' // Para o menu lateral
// //             });

// //         } catch (error) {
// //             console.error("Error fetching tool history:", error);
// //             res.status(500).send(`Error: ${error.message}`);
// //         }
// //     }
// // };

// // module.exports = toolHistoryController;

// // controllers/toolHistoryController.js
// const { Sequelize, Op } = require('sequelize');
// const { getTenantDB } = require('../config/database');
// const db = require('../models');

// const toolHistoryController = {
//     getAll: async (req, res) => {
//         const { tenantId } = req;
//         const { toolId, employeeId, movementType, startDate, endDate } = req.query;

//         try {
//             const sequelize = await getTenantDB(tenantId);
//             // Garante que todos os modelos necessários são inicializados
//             const { Tool, ToolMovement, Employee } = db.initialize(sequelize);

//             const whereClause = {};

//             if (toolId) whereClause.toolId = toolId;
//             if (employeeId) whereClause.employeeId = employeeId; // Lógica do filtro
//             if (movementType) whereClause.movementType = movementType;
//             if (startDate && endDate) {
//                 whereClause.movementDate = { [Op.between]: [new Date(startDate), new Date(endDate)] };
//             }

//             const movements = await ToolMovement.findAll({
//                 where: whereClause,
//                 include: [
//                     { model: Tool, as: 'tool', attributes: ['name', 'code'] },
//                     { model: Employee, as: 'employee', attributes: ['name'] }
//                 ],
//                 order: [['movementDate', 'DESC']]
//             });

//             // Busca os dados para preencher os dropdowns de filtro
//             const allTools = await Tool.findAll({ order: [['name', 'ASC']] });
//             const allEmployees = await Employee.findAll({ order: [['name', 'ASC']] });

//             // Renderiza a view, passando os dados e os filtros atuais
//             res.render('tool-history', {
//                 movements,
//                 allTools,
//                 allEmployees,
//                 filters: req.query, // Essencial para manter o estado do formulário
//                 user: req.session.user,
//                 paginaAtiva: 'tool-history'
//             });

//         } catch (error) {
//             console.error("Error fetching tool history:", error);
//             res.status(500).send(`Error: ${error.message}`);
//         }
//     }
// };

// module.exports = toolHistoryController;
// controllers/toolHistoryController.js
const { Sequelize, Op } = require('sequelize'); // Importamos o Op para os filtros
const { getTenantDB } = require('../config/database');
const db = require('../models');

const toolHistoryController = {
    /**
     * Lista TODO o histórico de movimentações com filtros E ORDENAÇÃO dinâmicos.
     */
    getAll: async (req, res) => {
        const { tenantId } = req;
        // 1. Captura filtros E parâmetros de ordenação
        const { toolId, employeeId, movementType, startDate, endDate, sort, order } = req.query;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Tool, ToolMovement, Employee } = db.initialize(sequelize);

            // --- 2. Lógica de Filtro (Where) ---
            const whereClause = {};
            if (toolId) whereClause.toolId = toolId;
            if (employeeId) whereClause.employeeId = employeeId;
            if (movementType) whereClause.movementType = movementType;
            if (startDate && endDate) {
                whereClause.movementDate = { [Op.between]: [new Date(startDate), new Date(endDate)] };
            } else if (startDate) {
                whereClause.movementDate = { [Op.gte]: new Date(startDate) };
            } else if (endDate) {
                whereClause.movementDate = { [Op.lte]: new Date(endDate) };
            }

            // --- 3. Lógica de Ordenação ---
            let sortColumn = sort || 'date'; // Padrão é ordenar por data
            let sortOrder = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'; // Padrão é DESC (mais novo primeiro)

            let finalOrder;
            switch (sortColumn) {
                case 'item':
                    finalOrder = [[{ model: Tool, as: 'tool' }, 'name', sortOrder]];
                    break;
                case 'employee':
                    finalOrder = [[{ model: Employee, as: 'employee' }, 'name', sortOrder]];
                    break;
                case 'type':
                    finalOrder = [['movementType', sortOrder]];
                    break;
                case 'date':
                default:
                    finalOrder = [['movementDate', sortOrder]];
                    break;
            }

            // 4. Busca as movimentações com filtro E ordenação
            const movements = await ToolMovement.findAll({
                where: whereClause,
                include: [
                    { model: Tool, as: 'tool', attributes: ['name', 'code'] },
                    { model: Employee, as: 'employee', attributes: ['name'] }
                ],
                order: finalOrder
            });

            // 5. Busca os dados para preencher os dropdowns de filtro
            const allTools = await Tool.findAll({ order: [['name', 'ASC']] });
            const allEmployees = await Employee.findAll({ order: [['name', 'ASC']] });

            // 6. Renderiza a view, passando todos os dados necessários
            res.render('tool-history', {
                movements,
                allTools,
                allEmployees,
                filters: req.query, // Envia os filtros de volta para a view
                user: req.session.user,
                paginaAtiva: 'tool-history',
                currentSort: { column: sortColumn, order: sortOrder } // Envia o estado atual da ordenação
            });

        } catch (error) {
            console.error("Error fetching tool history:", error);
            res.status(500).send(`Error: ${error.message}`);
        }
    }
};

module.exports = toolHistoryController;