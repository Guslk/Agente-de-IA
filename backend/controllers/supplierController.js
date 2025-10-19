// controllers/supplierController.js
const { getTenantDB } = require('../config/database');
const db = require('../models');
const Fornecedor = require('../models/supplier');

const supplierController = {
    /**
     * Lista todos os fornecedores, traduzindo os dados para a view.
     */
    getAll: async (req, res) => {
        const { tenantId } = req;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Supplier } = db.initialize(sequelize);

            // 1. Busca os dados do banco (eles virão com os nomes do modelo: 'id', 'name', etc.)
            const suppliersFromDB = await Supplier.findAll({ order: [['name', 'ASC']], raw: true });

            // 2. TRADUÇÃO: Mapeia do padrão do modelo (inglês) para o padrão da view (português)
            const fornecedoresParaView = suppliersFromDB.map(s => ({
                id_fornecedor: s.id,
                nome_empresa: s.name,
                contato: s.contactPerson,
                telefone: s.phoneNumber,
                email: s.email,
                endereco: s.address
            }));

            // 3. CORREÇÃO: Envia a lista traduzida com o nome 'fornecedores' que a view espera
            res.render('Fornecedores', { // Supondo que o arquivo se chame 'suppliers.ejs'
                fornecedores: fornecedoresParaView, // <-- O nome aqui deve ser 'fornecedores'
                user: req.session.user,
                query: req.query
            });

        } catch (error) {
            console.error("Error fetching suppliers:", error);
            res.status(500).send(`Error fetching suppliers: ${error.message}`);
        }
    },

    /**
     * Cria um novo fornecedor, traduzindo os dados do formulário.
     */
    create: async (req, res) => {
        try {
            const sequelize = await getTenantDB(req.tenantId);
            const { Supplier } = db.initialize(sequelize);

            // TRADUÇÃO: Mapeia do req.body (português) para o modelo (inglês)
            const dataToSave = {
                name: req.body.nome_empresa,
                contactPerson: req.body.contato,
                phoneNumber: req.body.telefone,
                email: req.body.email,
                address: req.body.endereco
            };

            await Supplier.create(dataToSave);
            res.redirect('/Fornecedores?success=true');
        } catch (error) {
            console.error("Error creating supplier:", error);
            res.status(500).send(`Error: ${error.message}`);
        }
    },

    /**
     * Atualiza um fornecedor.
     */
    update: async (req, res) => {
        const { id } = req.params;
        try {
            const sequelize = await getTenantDB(req.tenantId);
            const { Supplier } = db.initialize(sequelize);

            const supplier = await Supplier.findByPk(id);
            if (!supplier) return res.status(404).send('Supplier not found.');

            const dataToUpdate = {
                name: req.body.nome_empresa,
                contactPerson: req.body.contato,
                phoneNumber: req.body.telefone,
                email: req.body.email,
                address: req.body.endereco
            };

            await supplier.update(dataToUpdate);
            res.redirect('/Fornecedores?success=true');
        } catch (error) {
            console.error("Error updating supplier:", error);
            res.status(500).send(`Error: ${error.message}`);
        }
    },

    /**
     * Deleta um fornecedor.
     */
    destroy: async (req, res) => {
        const { id } = req.params;
        try {
            const sequelize = await getTenantDB(req.tenantId);
            const { Supplier } = db.initialize(sequelize);

            const supplier = await Supplier.findByPk(id);
            if (!supplier) return res.status(404).send('Supplier not found.');

            await supplier.destroy();
            res.redirect('/Fornecedores?success=true');
        } catch (error) {
            if (error.name === 'SequelizeForeignKeyConstraintError') {
                return res.redirect('/Fornecedores?error=supplier_in_use');
            }
            res.status(500).send(`Error: ${error.message}`);
        }
    }
};

module.exports = supplierController;