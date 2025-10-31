// controllers/chapasController.js

// Importações padronizadas conforme o modelo multitenant
const { getTenantDB } = require('../config/database'); 
const db = require('../models');
// Adiciona a importação do Op (Operadores) do Sequelize para consultas (ex: "maior que")
const { Op } = require('sequelize');

const chapasController = {
    
    /**
     * Renderiza a página principal do Controle de Chapas.
     * Esta é a rota que o usuário acessa, ex: GET /chapas
     */
    renderPage: async (req, res) => {
        try {
            // Renderiza a view 'chapas.ejs'. 
            // Os dados (chapas, barras) serão carregados pelo script do lado do cliente
            res.render('chapas', { 
                paginaAtiva: 'chapas', 
                user: req.session.user 
                // A variável 'lowStockCount' já é injetada em res.locals pelo middleware
            });
        } catch(error) {
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

    /**
     * API: Salva/Atualiza os cortes de uma chapa (usando transação).
     * Rota: POST /chapas/api/plates/:id/cuts
     */
    saveCuts: async (req, res) => {
        const { tenantId } = req;
        const plateId = req.params.id;
        const { cuts } = req.body; // 'cuts' é o array de coordenadas
        let transaction;
        
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Cut } = db.initialize(sequelize);

            if (!Cut) { throw new Error("O modelo 'Cut' não foi inicializado."); }
            
            transaction = await sequelize.transaction();

            // 1. Deleta os cortes antigos
            await Cut.destroy({ 
                where: { plate_id: plateId }, 
                transaction 
            });

            // 2. Insere os novos cortes
            if (cuts && cuts.length > 0) {
                const cutsToCreate = cuts.map(c => ({
                    plate_id: plateId,
                    coordinates: c // O Sequelize cuida do JSON.stringify
                }));
                
                await Cut.bulkCreate(cutsToCreate, { transaction });
            }

            // 3. Confirma a transação
            await transaction.commit();
            res.status(201).json({ message: "Cortes salvos com sucesso!" });

        } catch (err) {
            if (transaction) await transaction.rollback();
            console.error("Erro em [saveCuts]:", err.message);
            res.status(400).json({ error: err.message });
        }
    },

    // ===================================================
    // ==           NOVAS ROTAS DA API (BARRAS)         ==
    // ===================================================

    /**
     * API: Lista todas as barras disponíveis (comprimento restante > 0.1).
     * Rota: GET /chapas/api/bars
     */
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
     * API: Busca o histórico de consumo (cortes) de uma barra.
     * Rota: GET /chapas/api/bars/:id/history
     */
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
     * API: Registra um novo consumo (corte) em uma barra (usando transação).
     * Rota: POST /chapas/api/bars/consume
     */
    consumeBar: async (req, res) => {
        const { tenantId } = req;
        const { barId, consumedLength } = req.body;
        // Pega o nome do usuário logado a partir da sessão (tenta 'name' e 'nome')
        const consumedByUser = (req.session.user && (req.session.user.name || req.session.user.nome)) 
                             ? (req.session.user.name || req.session.user.nome) 
                             : "Usuário (Sistema)";
        
        let transaction;

        if (!barId || !consumedLength || isNaN(consumedLength) || consumedLength <= 0) {
            return res.status(400).json({ error: "Dados de consumo inválidos." });
        }

        try {
            const sequelize = await getTenantDB(tenantId);
            // IMPORTANTE: 'Bar' e 'BarCut' DEVEM ser inicializados
            const { Bar, BarCut } = db.initialize(sequelize);

            if (!Bar || !BarCut) { // Verificação de segurança
                 throw new Error("Os modelos 'Bar' ou 'BarCut' não foram inicializados. Verifique 'models/index.js'.");
            }

            transaction = await sequelize.transaction();

            // 1. Encontra a barra e a bloqueia para a transação
            const bar = await Bar.findByPk(barId, { 
                transaction, 
                lock: transaction.LOCK.UPDATE // Bloqueia a linha para evitar concorrência
            });

            if (!bar) {
                throw new Error("Barra não encontrada.");
            }

            // 2. Verifica se o consumo é válido
            const remaining = parseFloat(bar.remaining_length_mm);
            if (consumedLength > remaining + 0.01) { // Adiciona tolerância
                throw new Error(`Consumo (${consumedLength}mm) é maior que o restante (${remaining.toFixed(1)}mm).`);
            }

            // 3. Atualiza o comprimento restante da barra
            const newLength = remaining - consumedLength;
            await bar.update({ 
                remaining_length_mm: newLength 
            }, { transaction });

            // 4. Insere o registro de corte no histórico
            await BarCut.create({
                bar_id: barId,
                consumed_length_mm: consumedLength,
                consumed_by_user: consumedByUser,
                date: new Date()
                // 'notes' pode ser adicionado se você o enviar do frontend
            }, { transaction });

            // 5. Confirma a transação
            await transaction.commit();
            res.status(201).json({ message: "Consumo registrado com sucesso!" });

        } catch (err) {
            // 6. Desfaz a transação em caso de erro
            if (transaction) await transaction.rollback();
            console.error("Erro em [consumeBar]:", err.message);
            // Envia a mensagem de erro específica (ex: "Consumo é maior que...")
            res.status(400).json({ error: err.message });
        }
    }
};

module.exports = chapasController;

