// controllers/chapasController.js

const getModels = require('../models'); // Importa a função principal do models/index.js

const chapasController = {
    
    /**
     * Renderiza a página principal do Controle de Chapas.
     * Esta é a rota que o usuário acessa, ex: GET /chapas
     */
    renderPage: async (req, res) => {
        try {
            // Garante que o getModels foi carregado
            if (typeof getModels !== 'function') {
                throw new Error('Falha na configuração interna do servidor (getModels).');
            }
            
            // Renderiza a view 'chapas.ejs'. 
            // Os dados (chapas, cortes) serão carregados pelo script do lado do cliente (chapas-script.js)
            // que chamará as rotas da API abaixo.
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
    // ==               ROTAS DA API                    ==
    // == Usadas pelo seu 'chapas-script.js' via fetch  ==
    // ===================================================

    /**
     * API: Lista todas as chapas cadastradas.
     * Rota: GET /chapas/api/plates
     */
    listPlates: async (req, res) => {
        try {
            const { Plate } = await getModels(req.tenantId); 
            const plates = await Plate.findAll();
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
        try {
            const { Plate } = await getModels(req.tenantId); 
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
        try {
            const { Cut } = await getModels(req.tenantId);
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
        const plateId = req.params.id;
        const { cuts } = req.body; // 'cuts' é o array de coordenadas
        let transaction;
        
        try {
            // Obtém a instância do sequelize E os models
            const { sequelize, Cut } = await getModels(req.tenantId); 
            
            // Inicia uma transação
            transaction = await sequelize.transaction();

            // 1. Deleta os cortes antigos dentro da transação
            await Cut.destroy({ 
                where: { plate_id: plateId }, 
                transaction 
            });

            // 2. Insere os novos cortes dentro da transação
            if (cuts && cuts.length > 0) {
                // Prepara os dados para bulkCreate
                const cutsToCreate = cuts.map(c => ({
                    plate_id: plateId,
                    coordinates: c // O Sequelize cuidará do JSON.stringify
                }));
                
                await Cut.bulkCreate(cutsToCreate, { transaction });
            }

            // 3. Confirma a transação
            await transaction.commit();
            res.status(201).json({ message: "Cortes salvos com sucesso!" });

        } catch (err) {
            // 4. Desfaz a transação em caso de erro
            if (transaction) await transaction.rollback();
            console.error("Erro em [saveCuts]:", err.message);
            res.status(400).json({ error: err.message });
        }
    },
};

module.exports = chapasController;