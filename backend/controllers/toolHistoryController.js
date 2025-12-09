// // controllers/toolHistoryController.js
// const { Sequelize, Op } = require('sequelize'); // Garanta que 'Op' está importado
// const { getTenantDB } = require('../config/database');
// const db = require('../models');

// const toolHistoryController = {
//     /**
//      * Lista TODO o histórico de movimentações com filtros E ORDENAÇÃO dinâmicos.
//      */
//     getAll: async (req, res) => {
//         const { tenantId } = req;
//         const { toolId, employeeId, movementType, startDate, endDate, sort, order } = req.query;

//         try {
//             const sequelize = await getTenantDB(tenantId);
//             const { Tool, ToolMovement, Employee } = db.initialize(sequelize);

//             // --- 2. Lógica de Filtro (Where) ---
//             const whereClause = {};
            
//             // Correção 1: Ignora strings vazias dos filtros (ex: "Todos")
//             if (toolId && toolId !== "") {
//                 whereClause.toolId = toolId;
//             }
//             if (employeeId && employeeId !== "") {
//                 whereClause.employeeId = employeeId;
//             }
//             if (movementType && movementType !== "") {
//                 whereClause.movementType = movementType;
//             }
//             console.log(whereClause);
//             // ======================================================
//             //           CORREÇÃO 2: FILTRO DE DATA
//             // ======================================================
//             let start, end;
//             if (startDate) {
//                 // Converte a string de data (ex: '2025-10-19') para o início do dia
//                 start = new Date(startDate + 'T00:00:00.000Z');
//             }
//             if (endDate) {
//                 // Converte a string de data (ex: '2025-10-19') para o FIM do dia
//                 end = new Date(endDate + 'T23:59:59.999Z');
//             }

//             if (start && end) {
//                 whereClause.movementDate = { [Op.between]: [start, end] };
//             } else if (start) {
//                 whereClause.movementDate = { [Op.gte]: start }; // Maior ou igual ao início do dia
//             } else if (end) {
//                 whereClause.movementDate = { [Op.lte]: end }; // Menor ou igual ao fim do dia
//             }
//             // --- Fim da correção ---

//             // --- 3. Lógica de Ordenação (Sem alterações, já está correta) ---
//             let sortColumn = sort || 'date';
//             let sortOrder = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            
//             // ... (resto do seu switch case para 'finalOrder') ...
//             let finalOrder;
//             switch (sortColumn) {
//                 case 'item':
//                     finalOrder = [[{ model: Tool, as: 'tool' }, 'name', sortOrder]];
//                     break;
//                 case 'employee':
//                     finalOrder = [[{ model: Employee, as: 'employee' }, 'name', sortOrder]];
//                     break;
//                 case 'type':
//                     finalOrder = [['movementType', sortOrder]];
//                     break;
//                 case 'date':
//                 default:
//                     finalOrder = [['movementDate', sortOrder]];
//                     break;
//             }
//             // ...

//             // 4. Busca as movimentações com filtro E ordenação
//             const movements = await ToolMovement.findAll({
//                 where: whereClause,
//                 include: [
//                     { model: Tool, as: 'tool', attributes: ['name', 'code'] },
//                     { model: Employee, as: 'employee', attributes: ['name'] }
//                 ],
//                 order: finalOrder
//             });

//             // 5. Busca os dados para preencher os dropdowns de filtro
//             const allTools = await Tool.findAll({ order: [['name', 'ASC']] });
//             const allEmployees = await Employee.findAll({ order: [['name', 'ASC']] });

//             // 6. Renderiza a view
//             res.render('tool-history', {
//                 movements,
//                 allTools,
//                 allEmployees,
//                 filters: req.query,
// label: 'Data Início',
//                 user: req.session.user,
//                 paginaAtiva: 'tool-history',
//                 currentSort: { column: sortColumn, order: sortOrder }
//             });

//         } catch (error) {
//             console.error("Error fetching tool history:", error);
//             res.status(500).send(`Error: ${error.message}`);
//         }
//     }
// };

// module.exports = toolHistoryController;


// controllers/toolHistoryController.js
const { Sequelize, Op } = require('sequelize');
const { getTenantDB } = require('../config/database');
const db = require('../models');

const toolHistoryController = {
    /**
     * Lista TODO o histórico de movimentações com filtros E ORDENAÇÃO dinâmicos.
     */
    getAll: async (req, res) => {
        const { tenantId } = req;
        const { toolId, employeeId, movementType, startDate, endDate, sort, order } = req.query;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Tool, ToolMovement, Employee } = db.initialize(sequelize);

            // --- 2. Lógica de Filtro (Where) ---
            const whereClause = {};
            
            // Ignora strings vazias dos filtros
            if (toolId && toolId !== "") {
                whereClause.toolId = toolId;
            }
            if (employeeId && employeeId !== "") {
                whereClause.employeeId = employeeId;
            }
            if (movementType && movementType !== "") {
                whereClause.movementType = movementType;
            }

            // Filtro de data
            let start, end;
            if (startDate) {
                start = new Date(startDate + 'T00:00:00.000Z');
            }
            if (endDate) {
                end = new Date(endDate + 'T23:59:59.999Z');
            }

            if (start && end) {
                whereClause.movementDate = { [Op.between]: [start, end] };
            } else if (start) {
                whereClause.movementDate = { [Op.gte]: start };
            } else if (end) {
                whereClause.movementDate = { [Op.lte]: end };
            }

            // --- 3. Lógica de Ordenação ---
            let sortColumn = sort || 'date';
            let sortOrder = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            
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
                    { 
                        model: Tool, 
                        as: 'tool', 
                        attributes: ['name', 'code'],
                        required: true // Garante que sempre haverá uma ferramenta
                    },
                    { 
                        model: Employee, 
                        as: 'employee', 
                        attributes: ['name'],
                        required: false // Permite que employee seja null
                    }
                ],
                order: finalOrder
            });

            // 5. Busca os dados para preencher os dropdowns de filtro
            const allTools = await Tool.findAll({ order: [['name', 'ASC']] });
            const allEmployees = await Employee.findAll({ order: [['name', 'ASC']] });

            // 6. Renderiza a view
            res.render('tool-history', {
                movements,
                allTools,
                allEmployees,
                filters: req.query,
                user: req.session.user,
                paginaAtiva: 'tool-history',
                currentSort: { column: sortColumn, order: sortOrder }
            });

        } catch (error) {
            console.error("Error fetching tool history:", error);
            res.status(500).send(`Error: ${error.message}`);
        }
    }
};

module.exports = toolHistoryController;