// // controllers/chapasController.js

// // Importações padronizadas conforme o modelo multitenant
// const { getTenantDB } = require('../config/database'); 
// const db = require('../models');
// // Adiciona a importação do Op (Operadores) do Sequelize para consultas (ex: "maior que")
// const { Op } = require('sequelize');

// const chapasController = {

//     /**
//      * Renderiza a página principal do Controle de Chapas.
//      * Esta é a rota que o usuário acessa, ex: GET /chapas
//      */
//     renderPage: async (req, res) => {
//         try {
//             // Renderiza a view 'chapas.ejs'. 
//             // Os dados (chapas, barras) serão carregados pelo script do lado do cliente
//             res.render('chapas', { 
//                 paginaAtiva: 'chapas', 
//                 user: req.session.user 
//                 // A variável 'lowStockCount' já é injetada em res.locals pelo middleware
//             });
//         } catch(error) {
//              console.error("Erro ao renderizar /chapas:", error);
//              res.status(500).send(`Erro ao carregar a página: ${error.message}`);
//         }
//     },

//     // ===================================================
//     // ==           ROTAS DA API (CHAPAS)             ==
//     // ===================================================

//     /**
//      * API: Lista todas as chapas cadastradas.
//      * Rota: GET /chapas/api/plates
//      */
//     listPlates: async (req, res) => {
//         const { tenantId } = req;
//         try {
//             const sequelize = await getTenantDB(tenantId);
//             const { Plate } = db.initialize(sequelize);

//             if (!Plate) { // Verificação de segurança
//                 throw new Error("O modelo 'Plate' não foi inicializado. Verifique 'models/index.js'.");
//             }

//             const plates = await Plate.findAll({ order: [['name', 'ASC']] });
//             res.json({ message: "success", data: plates });
//         } catch (err) { 
//             console.error("Erro em [listPlates]:", err); 
//             res.status(500).json({ error: err.message }); 
//         }
//     },

//     /**
//      * API: Cria uma nova chapa no banco de dados.
//      * Rota: POST /chapas/api/plates
//      */
//     createPlate: async (req, res) => {
//         const { tenantId } = req;
//         try {
//             const sequelize = await getTenantDB(tenantId);
//             const { Plate } = db.initialize(sequelize);

//             if (!Plate) { throw new Error("O modelo 'Plate' não foi inicializado."); }

//             const { name, width, height } = req.body;

//             if (!name || width == null || height == null) {
//                  return res.status(400).json({ "error": "Campos obrigatórios: name, width, height." });
//             }

//             const newPlate = await Plate.create({ 
//                 name, 
//                 original_width_mm: width, 
//                 original_height_mm: height 
//             });
//             res.status(201).json({ message: "success", data: newPlate });

//         } catch (err) { 
//             console.error("Erro em [createPlate]:", err); 
//             res.status(400).json({ error: err.message }); 
//         }
//     },

//     /**
//      * API: Busca todos os cortes de uma chapa específica.
//      * Rota: GET /chapas/api/plates/:id/cuts
//      */
//     getCuts: async (req, res) => {
//         const { tenantId } = req;
//         try {
//             const sequelize = await getTenantDB(tenantId);
//             const { Cut } = db.initialize(sequelize);

//             if (!Cut) { throw new Error("O modelo 'Cut' não foi inicializado."); }

//             const cuts = await Cut.findAll({ where: { plate_id: req.params.id } });
//             res.json({ message: "success", data: cuts });
//         } catch (err) { 
//             console.error("Erro em [getCuts]:", err); 
//             res.status(500).json({ error: err.message }); 
//         }
//     },

//     /**
//      * API: Salva/Atualiza os cortes de uma chapa (usando transação).
//      * Rota: POST /chapas/api/plates/:id/cuts
//      */
//     saveCuts: async (req, res) => {
//         const { tenantId } = req;
//         const plateId = req.params.id;
//         const { cuts } = req.body; // 'cuts' é o array de coordenadas
//         let transaction;

//         try {
//             const sequelize = await getTenantDB(tenantId);
//             const { Cut } = db.initialize(sequelize);

//             if (!Cut) { throw new Error("O modelo 'Cut' não foi inicializado."); }

//             transaction = await sequelize.transaction();

//             // 1. Deleta os cortes antigos
//             await Cut.destroy({ 
//                 where: { plate_id: plateId }, 
//                 transaction 
//             });

//             // 2. Insere os novos cortes
//             if (cuts && cuts.length > 0) {
//                 const cutsToCreate = cuts.map(c => ({
//                     plate_id: plateId,
//                     coordinates: c // O Sequelize cuida do JSON.stringify
//                 }));

//                 await Cut.bulkCreate(cutsToCreate, { transaction });
//             }

//             // 3. Confirma a transação
//             await transaction.commit();
//             res.status(201).json({ message: "Cortes salvos com sucesso!" });

//         } catch (err) {
//             if (transaction) await transaction.rollback();
//             console.error("Erro em [saveCuts]:", err.message);
//             res.status(400).json({ error: err.message });
//         }
//     },

//     // ===================================================
//     // ==           NOVAS ROTAS DA API (BARRAS)         ==
//     // ===================================================

//     /**
//      * API: Lista todas as barras disponíveis (comprimento restante > 0.1).
//      * Rota: GET /chapas/api/bars
//      */
//     listBars: async (req, res) => {
//         const { tenantId } = req;
//         try {
//             const sequelize = await getTenantDB(tenantId);
//             // IMPORTANTE: O 'Bar' DEVE ser inicializado em models/index.js
//             const { Bar } = db.initialize(sequelize);

//             if (!Bar) { // Verificação de segurança
//                 throw new Error("O modelo 'Bar' não foi inicializado. Verifique 'models/index.js'.");
//             }

//             const bars = await Bar.findAll({
//                 where: {
//                     remaining_length_mm: {
//                         [Op.gt]: 0.1 // Só lista barras que ainda têm material
//                     }
//                 },
//                 order: [['name', 'ASC']]
//             });
//             res.json({ message: "success", data: bars });
//         } catch (err) { 
//             console.error("Erro em [listBars]:", err); 
//             res.status(500).json({ error: err.message }); 
//         }
//     },

//     // --- FUNÇÃO ADICIONADA ---
//     /**
//      * API: Cria uma nova barra no banco de dados.
//      * Rota: POST /chapas/api/bars
//      */
//     createBar: async (req, res) => {
//         const { tenantId } = req;
//         try {
//             const sequelize = await getTenantDB(tenantId);
//             const { Bar } = db.initialize(sequelize);

//             if (!Bar) { 
//                 throw new Error("O modelo 'Bar' não foi inicializado.");
//             }

//             const { name, length, diameter, material } = req.body;

//             if (!name || length == null || isNaN(parseFloat(length)) || length <= 0) {
//                  return res.status(400).json({ "error": "Campos obrigatórios: name, length." });
//             }

//             const newBar = await Bar.create({ 
//                 name, 
//                 original_length_mm: length, 
//                 remaining_length_mm: length, // No cadastro, o restante é igual ao original
//                 diameter_mm: diameter || null,
//                 material: material || null
//             });
//             res.status(201).json({ message: "success", data: newBar });

//         } catch (err) { 
//             console.error("Erro em [createBar]:", err); 
//             res.status(400).json({ error: err.message }); 
//         }
//     },
//     // --- FIM DA FUNÇÃO ADICIONADA ---

//     /**
//      * API: Busca o histórico de consumo (cortes) de uma barra.
//      * Rota: GET /chapas/api/bars/:id/history
//      */
//     getBarHistory: async (req, res) => {
//         const { tenantId } = req;
//         try {
//             const sequelize = await getTenantDB(tenantId);
//             // IMPORTANTE: O 'BarCut' DEVE ser inicializado em models/index.js
//             const { BarCut } = db.initialize(sequelize);

//             if (!BarCut) { // Verificação de segurança
//                 throw new Error("O modelo 'BarCut' não foi inicializado. Verifique 'models/index.js'.");
//             }

//             const cuts = await BarCut.findAll({
//                 where: { bar_id: req.params.id },
//                 order: [['date', 'DESC']]
//             });
//             res.json({ message: "success", data: cuts });
//         } catch (err) { 
//             console.error("Erro em [getBarHistory]:", err); 
//             res.status(500).json({ error: err.message }); 
//         }
//     },

//     /**
//      * API: Registra um novo consumo (corte) em uma barra (usando transação).
//      * Rota: POST /chapas/api/bars/consume
//      */
//     consumeBar: async (req, res) => {
//         const { tenantId } = req;
//         const { barId, consumedLength } = req.body;
//         // Pega o nome do usuário logado a partir da sessão (tenta 'name' e 'nome')
//         const consumedByUser = (req.session.user && (req.session.user.name || req.session.user.nome)) 
//                              ? (req.session.user.name || req.session.user.nome) 
//                              : "Usuário (Sistema)";

//         let transaction;

//         if (!barId || !consumedLength || isNaN(consumedLength) || consumedLength <= 0) {
//             return res.status(400).json({ error: "Dados de consumo inválidos." });
//         }

//         try {
//             const sequelize = await getTenantDB(tenantId);
//             // IMPORTANTE: 'Bar' e 'BarCut' DEVEM ser inicializados
//             const { Bar, BarCut } = db.initialize(sequelize);

//             if (!Bar || !BarCut) { // Verificação de segurança
//                  throw new Error("Os modelos 'Bar' ou 'BarCut' não foram inicializados. Verifique 'models/index.js'.");
//             }

//             transaction = await sequelize.transaction();

//             // 1. Encontra a barra e a bloqueia para a transação
//             const bar = await Bar.findByPk(barId, { 
//                 transaction, 
//                 lock: transaction.LOCK.UPDATE // Bloqueia a linha para evitar concorrência
//             });

//             if (!bar) {
//                 throw new Error("Barra não encontrada.");
//             }

//             // 2. Verifica se o consumo é válido
//             const remaining = parseFloat(bar.remaining_length_mm);
//             if (consumedLength > remaining + 0.01) { // Adiciona tolerância
//                 throw new Error(`Consumo (${consumedLength}mm) é maior que o restante (${remaining.toFixed(1)}mm).`);
//             }

//             // 3. Atualiza o comprimento restante da barra
//             const newLength = remaining - consumedLength;
//             await bar.update({ 
//                 remaining_length_mm: newLength 
//             }, { transaction });

//             // 4. Insere o registro de corte no histórico
//             await BarCut.create({
//                 bar_id: barId,
//                 consumed_length_mm: consumedLength,
//                 consumed_by_user: consumedByUser,
//                 date: new Date()
//                 // 'notes' pode ser adicionado se você o enviar do frontend
//             }, { transaction });

//             // 5. Confirma a transação
//             await transaction.commit();
//             res.status(201).json({ message: "Consumo registrado com sucesso!" });

//         } catch (err) {
//             // 6. Desfaz a transação em caso de erro
//             if (transaction) await transaction.rollback();
//             console.error("Erro em [consumeBar]:", err.message);
//             // Envia a mensagem de erro específica (ex: "Consumo é maior que...")
//             res.status(400).json({ error: err.message });
//         }
//     }
// };

// module.exports = chapasController;

// controllers/chapasController.js

const { getTenantDB } = require('../config/database');
const db = require('../models');
const { Op } = require('sequelize');

const chapasController = {

    renderPage: async (req, res) => {
        try {
            // Renderiza a view 'chapas.ejs'. 
            // Os dados (chapas, barras) serão carregados pelo script do lado do cliente
            res.render('chapas', {
                paginaAtiva: 'chapas',
                user: req.session.user
                // A variável 'lowStockCount' já é injetada em res.locals pelo middleware
            });
        } catch (error) {
            console.error("Erro ao renderizar /chapas:", error);
            res.status(500).send(`Erro ao carregar a página: ${error.message}`);
        }
    },

    // ===================================================
    // ==           ROTAS DA API (CHAPAS)             ==
    // ===================================================

    /**
     * API: Lista todas as chapas cadastradas.
     * Rota: GET /chapas/api/plates
     */
   listPlates: async (req, res) => {
        const { tenantId } = req;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Plate } = db.initialize(sequelize);

            if (!Plate) { // Verificação de segurança
                throw new Error("O modelo 'Plate' não foi inicializado. Verifique 'models/index.js'.");
            }

            // Esta é a lógica correta: apenas buscar todas as chapas
            const plates = await Plate.findAll({ order: [['name', 'ASC']] });
            res.json({ message: "success", data: plates });
            
        } catch (err) { 
            console.error("Erro em [listPlates]:", err); 
            res.status(500).json({ error: err.message }); 
        }
    },

    /**
     * API: Cria uma nova chapa no banco de dados.
     * Rota: POST /chapas/api/plates
     */
    createPlate: async (req, res) => {
        const { tenantId } = req;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Plate } = db.initialize(sequelize);

            if (!Plate) { throw new Error("O modelo 'Plate' não foi inicializado."); }

            const { name, width, height } = req.body;

            if (!name || width == null || height == null) {
                return res.status(400).json({ "error": "Campos obrigatórios: name, width, height." });
            }

            const newPlate = await Plate.create({
                name,
                original_width_mm: width,
                original_height_mm: height
            });
            res.status(201).json({ message: "success", data: newPlate });

        } catch (err) {
            console.error("Erro em [createPlate]:", err);
            res.status(400).json({ error: err.message });
        }
    },

    getPlateHistory: async (req, res) => {
        const { tenantId } = req;
        const plateId = req.params.id;

        try {
            const sequelize = await getTenantDB(tenantId);
            // Precisamos do Item e do Stock para esta consulta
            const { Item, Stock } = db.initialize(sequelize);

            // Filtra itens cujo código comece com 'CHP-<ID_DA_CHAPA>-'
            const plateItems = await Item.findAll({
                where: {
                    code: {
                        [Op.like]: `CHP-${plateId}-%`
                    }
                },
                include: [{
                    model: Stock,
                    as: 'stock',
                    attributes: ['name']
                }],
                order: [['id', 'DESC']] // Mostra os mais recentes primeiro
            });

            res.json({ message: "success", data: plateItems });

        } catch (err) {
            console.error("Erro em [getPlateHistory]:", err);
            res.status(500).json({ error: err.message });
        }
    },



    createBar: async (req, res) => {
        const { tenantId } = req;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Bar } = db.initialize(sequelize);

            if (!Bar) {
                throw new Error("O modelo 'Bar' não foi inicializado.");
            }

            const { name, length, diameter, material } = req.body;

            if (!name || length == null || isNaN(parseFloat(length)) || length <= 0) {
                return res.status(400).json({ "error": "Campos obrigatórios: name, length." });
            }

            const newBar = await Bar.create({
                name,
                original_length_mm: length,
                remaining_length_mm: length, // No cadastro, o restante é igual ao original
                diameter_mm: diameter || null,
                material: material || null
            });
            res.status(201).json({ message: "success", data: newBar });

        } catch (err) {
            console.error("Erro em [createBar]:", err);
            res.status(400).json({ error: err.message });
        }
    },

    getBarHistory: async (req, res) => {
        const { tenantId } = req;
        try {
            const sequelize = await getTenantDB(tenantId);
            // IMPORTANTE: O 'BarCut' DEVE ser inicializado em models/index.js
            const { BarCut } = db.initialize(sequelize);

            if (!BarCut) { // Verificação de segurança
                throw new Error("O modelo 'BarCut' não foi inicializado. Verifique 'models/index.js'.");
            }

            const cuts = await BarCut.findAll({
                where: { bar_id: req.params.id },
                order: [['date', 'DESC']]
            });
            res.json({ message: "success", data: cuts });
        } catch (err) { 
            console.error("Erro em [getBarHistory]:", err); 
            res.status(500).json({ error: err.message }); 
        }
    },

    /**
     * API: Busca todos os cortes de uma chapa específica.
     * Rota: GET /chapas/api/plates/:id/cuts
     */
    getCuts: async (req, res) => {
        const { tenantId } = req;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Cut } = db.initialize(sequelize);

            if (!Cut) { throw new Error("O modelo 'Cut' não foi inicializado."); }

            const cuts = await Cut.findAll({ where: { plate_id: req.params.id } });
            res.json({ message: "success", data: cuts });
        } catch (err) {
            console.error("Erro em [getCuts]:", err);
            res.status(500).json({ error: err.message });
        }
    },

   listBars: async (req, res) => {
        const { tenantId } = req;
        try {
            const sequelize = await getTenantDB(tenantId);
            // IMPORTANTE: O 'Bar' DEVE ser inicializado em models/index.js
            const { Bar } = db.initialize(sequelize);

            if (!Bar) { // Verificação de segurança
                throw new Error("O modelo 'Bar' não foi inicializado. Verifique 'models/index.js'.");
            }

            const bars = await Bar.findAll({
                where: {
                    remaining_length_mm: {
                        [Op.gt]: 0.1 // Só lista barras que ainda têm material
                    }
                },
                order: [['name', 'ASC']]
            });
            res.json({ message: "success", data: bars });
        } catch (err) {
            console.error("Erro em [listBars]:", err);
            res.status(500).json({ error: err.message });
        }
    },
    /**
     * API: Salva/Atualiza os cortes de uma chapa E cria itens correspondentes
     * Rota: POST /chapas/api/plates/:id/cuts
     */
    saveCuts: async (req, res) => {
        const { tenantId } = req;
        const plateId = req.params.id;
        const { cuts, createItems = false, cutsToCreateItemsFor = [], itemPrefix = "Corte Chapa" } = req.body;
        let transaction;
        const consumedByUser = (req.session.user && (req.session.user.name || req.session.user.nome))
            ? (req.session.user.name || req.session.user.nome)
            : "Usuário (Sistema)";

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Cut, Plate, Item, Stock } = db.initialize(sequelize);

            if (!Cut || !Plate) {
                throw new Error("Modelos necessários não inicializados.");
            }

            transaction = await sequelize.transaction();

            // 1. Busca a chapa para obter informações
            const plate = await Plate.findByPk(plateId, { transaction });
            if (!plate) {
                throw new Error("Chapa não encontrada.");
            }

            // 2. Deleta os cortes antigos
            await Cut.destroy({
                where: { plate_id: plateId },
                transaction
            });

            // 3. Insere os novos cortes
            let createdCuts = [];
            if (cuts && cuts.length > 0) {
                const cutsToCreate = cuts.map(c => ({
                    plate_id: plateId,
                    coordinates: c
                }));

                createdCuts = await Cut.bulkCreate(cutsToCreate, {
                    transaction,
                    returning: true
                });
            }

            // 4. SE solicitado, cria itens no estoque para cada corte
            let createdItems = [];
            // vvv CONDIÇÃO ATUALIZADA vvv
            if (createItems && createdCuts.length > 0 && cutsToCreateItemsFor.length > 0) {
                
                // Pega o número de itens a criar (enviado pelo front)
                const newItemCount = cutsToCreateItemsFor.length;
                
                // Pega os *últimos* N itens da lista de cortes recém-criados no DB
                // (Assumindo que a ordem do bulkCreate é mantida)
                const cutsForItems = createdCuts.slice(-newItemCount);

                createdItems = await chapasController._createPlateCutItems(
                    cutsForItems,
                    plate,
                    itemPrefix,
                    consumedByUser, // <-- Passe o nome do usuário aqui
                    { Item, Stock, transaction }
                );
            }

            await transaction.commit();

            const message = createItems
                ? `Cortes salvos e ${createdItems.length} itens criados com sucesso!`
                : "Cortes salvos com sucesso!";

            res.status(201).json({
                message,
                data: {
                    cuts: createdCuts,
                    itemsCreated: createItems,
                    items: createdItems
                }
            });

        } catch (err) {
            if (transaction) await transaction.rollback();
            console.error("Erro em [saveCuts]:", err.message);
            res.status(400).json({ error: err.message });
        }
    },

    _createPlateCutItems: async (cuts, plate, itemPrefix, userName, { Item, Stock, transaction }) => {
        try {
            // Encontra ou cria um stock padrão para chapas cortadas
            let stock = await Stock.findOne({
                where: { name: 'Chapas Cortadas' },
                transaction
            });

            if (!stock) {
                stock = await Stock.create({
                    name: 'Chapas Cortadas',
                    description: 'Estoque para chapas após corte',
                    status: 'Ativo'
                }, { transaction });
            }

            // Cria um item para cada corte usando apenas campos existentes
            const itemsToCreate = cuts.map((cut, index) => {
                const area = chapasController._calculateCutArea(cut.coordinates);
                const itemName = `${itemPrefix} ${plate.name} - Peça ${index + 1}`;

                let cutWidth = 0;
                let cutHeight = 0;
                let cutDimensions = "Dimensões N/A"; 

                if (cut.coordinates && cut.coordinates.length === 4 && cut.coordinates[0] && cut.coordinates[1] && cut.coordinates[3]) {
                    cutWidth = Math.abs(cut.coordinates[1].x - cut.coordinates[0].x);
                    cutHeight = Math.abs(cut.coordinates[3].y - cut.coordinates[0].y);
                    cutDimensions = `${cutWidth.toFixed(1)}mm x ${cutHeight.toFixed(1)}mm`;
                }

                return {
                    stockId: stock.id,
                    name: itemName,
                    quantity: 1,
                    
                    // --- DESCRIÇÃO ATUALIZADA (INCLUI O USUÁRIO) ---
                    description: `Peça de ${cutDimensions} (corte da chapa ${plate.name}). Área aproximada: ${area} mm². Criado por: ${userName || 'N/A'}. Corte ID: ${cut.id}`,
                    
                    position: `CHAPA-${plate.id}-C${index + 1}`,
                    code: `CHP-${plate.id}-${Date.now()}-${index}`,
                    unitOfMeasure: 'un',
                    minimumQuantity: 0,
                    status: 'Ativo',
                    totalValue: 0.00,
                    reservedQuantity: 0.00
                };
            });

            const createdItems = await Item.bulkCreate(itemsToCreate, { transaction });
            return createdItems;

        } catch (error) {
            console.error("Erro ao criar itens para cortes:", error);
            throw new Error(`Falha ao criar itens: ${error.message}`);
        }
    },

    /**
     * Método auxiliar: Calcula área do corte
     */
    _calculateCutArea: (coordinates) => {
        if (!coordinates || coordinates.length < 3) return 0;

        let area = 0;
        for (let i = 0; i < coordinates.length; i++) {
            const j = (i + 1) % coordinates.length;
            area += coordinates[i].x * coordinates[j].y;
            area -= coordinates[j].x * coordinates[i].y;
        }
        return Math.abs(area / 2).toFixed(2);
    },

    /**
     * API: Registra consumo de barra E cria item correspondente
     * Rota: POST /chapas/api/bars/consume
     */
    consumeBar: async (req, res) => {
        const { tenantId } = req;
        const { barId, consumedLength, createItem = false, itemName, itemCode, itemDescription } = req.body;

        const consumedByUser = (req.session.user && (req.session.user.name || req.session.user.nome))
            ? (req.session.user.name || req.session.user.nome)
            : "Usuário (Sistema)";

        let transaction;

        if (!barId || !consumedLength || isNaN(consumedLength) || consumedLength <= 0) {
            return res.status(400).json({ error: "Dados de consumo inválidos." });
        }

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Bar, BarCut, Item, Stock } = db.initialize(sequelize);

            if (!Bar || !BarCut) {
                throw new Error("Modelos necessários não inicializados.");
            }

            transaction = await sequelize.transaction();

            // 1. Encontra e bloqueia a barra
            const bar = await Bar.findByPk(barId, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!bar) {
                throw new Error("Barra não encontrada.");
            }

            // 2. Verifica se o consumo é válido
            const remaining = parseFloat(bar.remaining_length_mm);
            if (consumedLength > remaining + 0.01) {
                throw new Error(`Consumo (${consumedLength}mm) é maior que o restante (${remaining.toFixed(1)}mm).`);
            }

            // 3. Atualiza o comprimento restante
            const newLength = remaining - consumedLength;
            await bar.update({
                remaining_length_mm: newLength
            }, { transaction });

            // 4. Insere registro de corte
            const barCut = await BarCut.create({
                bar_id: barId,
                consumed_length_mm: consumedLength,
                consumed_by_user: consumedByUser,
                date: new Date()
            }, { transaction });

            // 5. SE solicitado, cria item no estoque
            let createdItem = null;
            if (createItem) {
                createdItem = await chapasController._createBarCutItem(
                    barCut,
                    bar,
                    consumedLength,
                    itemName,
                    itemCode,
                    itemDescription,
                    { Item, Stock, transaction }
                );
            }

            await transaction.commit();

            const response = {
                message: createItem
                    ? "Consumo registrado e item criado com sucesso!"
                    : "Consumo registrado com sucesso!",
                data: {
                    remainingLength: newLength,
                    itemCreated: createItem,
                    item: createdItem
                }
            };

            res.status(201).json(response);

        } catch (err) {
            if (transaction) await transaction.rollback();
            console.error("Erro em [consumeBar]:", err.message);
            res.status(400).json({ error: err.message });
        }
    },

    /**
     * Método auxiliar: Cria item no estoque para corte de barra
     * USANDO APENAS CAMPOS EXISTENTES NO MODELO ITEM
     */
    _createBarCutItem: async (barCut, bar, consumedLength, itemName, itemCode, itemDescription, { Item, Stock, transaction }) => {
        try {
            // Encontra ou cria stock para barras cortadas
            let stock = await Stock.findOne({
                where: { name: 'Barras Cortadas' },
                transaction
            });

            if (!stock) {
                stock = await Stock.create({
                    name: 'Barras Cortadas',
                    description: 'Estoque para barras após corte',
                    status: 'Ativo'
                }, { transaction });
            }

            // Prepara dados do item usando campos existentes
            const finalItemName = itemName || `Barra ${bar.name} - ${consumedLength}mm`;
            const finalItemCode = itemCode || `BAR-${bar.id}-${Date.now()}`;
            const finalDescription = itemDescription ||
                `Corte de ${consumedLength}mm da barra ${bar.name}. 
                 Diâmetro: ${bar.diameter_mm || 'N/A'}mm, Material: ${bar.material || 'N/A'}.
                 Barra Original ID: ${bar.id}, Corte ID: ${barCut.id}`;

            const newItem = await Item.create({
                stockId: stock.id,
                name: finalItemName,
                quantity: 1, // Cada corte vira 1 unidade
                description: finalDescription,
                position: `BARRA-${bar.id}-C${barCut.id}`,
                code: finalItemCode,
                unitOfMeasure: 'un',
                minimumQuantity: 0,
                status: 'Ativo',
                totalValue: 0.00, // Pode ser calculado se tiver custo da barra
                reservedQuantity: 0.00
            }, { transaction });

            return newItem;

        } catch (error) {
            console.error("Erro ao criar item para corte de barra:", error);
            throw new Error(`Falha ao criar item: ${error.message}`);
        }
    },

    /**
     * NOVA API: Busca itens criados a partir de cortes
     * Rota: GET /chapas/api/cut-items?search=chapa|barra
     */
    getCutItems: async (req, res) => {
        const { tenantId } = req;
        const { search } = req.query;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Item, Stock } = db.initialize(sequelize);

            let whereClause = {};
            if (search) {
                whereClause = {
                    [Op.or]: [
                        { name: { [Op.like]: `%${search}%` } },
                        { description: { [Op.like]: `%${search}%` } },
                        { code: { [Op.like]: `%${search}%` } }
                    ]
                };
            }

            const items = await Item.findAll({
                where: whereClause,
                include: [
                    {
                        model: Stock,
                        as: 'stock',
                        attributes: ['id', 'name']
                    }
                ],
                order: [['id', 'DESC']]
            });

            // Filtra itens que parecem ser de cortes (opcional)
            const cutItems = items.filter(item =>
                item.description &&
                (item.description.includes('Corte da chapa') ||
                    item.description.includes('Corte de') && item.description.includes('mm da barra'))
            );

            res.json({ message: "success", data: cutItems });

        } catch (err) {
            console.error("Erro em [getCutItems]:", err);
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = chapasController;