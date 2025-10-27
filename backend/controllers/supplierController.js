
// controllers/supplierController.js
const { Sequelize, Op } = require('sequelize');
const { getTenantDB } = require('../config/database');
const db = require('../models');

const supplierController = {
    /**
     * Lista todos os fornecedores, separados por status.
     */
    getAll: async (req, res) => {
        const { tenantId } = req;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Supplier } = db.initialize(sequelize);

            const whereActive = { status: 'Ativo' };
            const whereDeactivated = { status: 'Desativado' };
            const whereExcluded = { status: 'Excluido' };

            // 1. Busca Fornecedores Ativos
            const activeSuppliers = await Supplier.findAll({
                where: whereActive,
                order: [['name', 'ASC']]
            });
            
            // 2. Busca Fornecedores Desativados
            const deactivatedSuppliers = await Supplier.findAll({
                where: whereDeactivated,
                order: [['name', 'ASC']]
            });

            // 3. Busca Fornecedores Excluídos (Lixeira)
            const excludedSuppliers = await Supplier.findAll({
                where: whereExcluded,
                order: [['name', 'ASC']]
            });

            // Renderiza a view 'fornecedores.ejs'
            res.render('fornecedores', { 
                activeSuppliers,
                deactivatedSuppliers,
                excludedSuppliers,
                user: req.session.user, 
                query: req.query 
            });

        } catch (error) {
            console.error("Erro ao buscar fornecedores:", error);
            res.render('fornecedores', { 
                activeSuppliers: [], 
                deactivatedSuppliers: [], 
                excludedSuppliers: [], 
                user: req.session.user, 
                query: { error: 'fetch_failed' } 
            });
        }
    },

    /**
     * Cria um novo fornecedor.
     */
    create: async (req, res) => {
        const { tenantId } = req;
        const { companyName, contactPerson, phoneNumber, email, address } = req.body;
        
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Supplier } = db.initialize(sequelize);
            
            await Supplier.create({
                companyName,
                contactPerson,
                phoneNumber,
                email,
                address,
                status: 'Ativo' // Padrão
            });
            res.redirect('/fornecedores?success=created');
        } catch (error) {
            console.error("Error creating supplier:", error);
            res.redirect(`/fornecedores?error=${error.message || 'create_failed'}`);
        }
    },

    /**
     * Atualiza um fornecedor.
     */
    update: async (req, res) => {
        const { tenantId } = req;
        const { id } = req.params;
        const { companyName, contactPerson, phoneNumber, email, address, status } = req.body;
        
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Supplier } = db.initialize(sequelize);

            const supplier = await Supplier.findByPk(id);
            if (!supplier) return res.status(404).send('Fornecedor não encontrado.');

            await supplier.update({
                companyName,
                contactPerson,
                phoneNumber,
                email,
                address,
                status
            });
            
            res.redirect('/fornecedores?success=updated');
        } catch (error) {
            console.error("Error updating supplier:", error);
            res.redirect(`/fornecedores?error=${error.message || 'update_failed'}`);
        }
    },

    /**
     * "Deleta" (Exclui) um fornecedor (Soft Delete).
     */
    destroy: async (req, res) => {
        const { tenantId } = req;
        const { id } = req.params;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Supplier } = db.initialize(sequelize);

            const supplier = await Supplier.findByPk(id);
            if (!supplier) return res.status(404).send('Fornecedor não encontrado.');

            await supplier.update({ status: 'Excluido' });
            
            res.redirect('/fornecedores?success=deleted');
        } catch (error) {
            // Captura o erro se o fornecedor tiver entradas (Entries) associadas
            if (error.name === 'SequelizeForeignKeyConstraintError') {
                return res.redirect('/fornecedores?error=supplier_in_use');
            }
            console.error("Error 'deleting' supplier:", error);
            res.redirect(`/fornecedores?error=${error.message || 'delete_failed'}`);
        }
    },

    /**
     * "Restaura" um fornecedor (Soft Delete)
     */
    restore: async (req, res) => {
        const { tenantId } = req;
        const { id } = req.params;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Supplier } = db.initialize(sequelize);

            const supplier = await Supplier.findByPk(id);
            if (supplier) {
                await supplier.update({ status: 'Ativo' });
                res.redirect('/fornecedores?success=restored');
            } else {
                res.redirect('/fornecedores?error=not_found');
            }
        } catch (error) {
            console.error("Erro ao restaurar fornecedor:", error);
            res.redirect(`/fornecedores?error=${error.message || 'restore_failed'}`);
        }
    }
};

module.exports = supplierController;