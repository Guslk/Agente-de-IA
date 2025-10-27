// controllers/employeeController.js
const { getTenantDB } = require('../config/database');
const db = require('../models');
const bcrypt = require('bcryptjs');
const saltRounds = 10;

const employeeController = {
    /**
     * Lista todos os funcionários.
     */
    getAll: async (req, res) => {
        const { tenantId } = req;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Employee } = db.initialize(sequelize);

            const employees = await Employee.findAll({
                order: [['name', 'ASC']],
                attributes: ['id', 'name', 'email', 'position', 'role','photo']
            });

            res.render('funcionarios', {
                funcionarios: employees,
                user: req.session.user,
                query: req.query
            });
        } catch (error) {
            // Se a busca falhar, renderiza a página com um erro
            console.error("Error fetching employees:", error);
            res.render('funcionarios', {
                funcionarios: [],
                user: req.session.user,
                query: { error: 'fetch_failed' } // Novo código de erro
            });
        }
    },

    /**
     * Cria um novo funcionário.
     */

    create: async (req, res) => {
        const { tenantId } = req;
        const { name, email, position, role, password } = req.body;

        try {
            const sequelize = await getTenantDB(tenantId);
            const { Employee } = db.initialize(sequelize);

            const passwordHash = await bcrypt.hash(password, saltRounds);

            await Employee.create({
                name,
                email,
                position,
                role,
                passwordHash: passwordHash,
                twoFactorEnabled: false,
                                forcePasswordChange: true,
                photo: req.file ? req.file.buffer : null
                // photo: "null" // Corrigido para 'null' para ser compatível com o banco
            });

            res.redirect('/funcionarios?success=created');

        } catch (error) {
            // ===============================================
            //           LÓGICA DE ERRO APRIMORADA 👇
            // ===============================================

            // Verifica se o erro é de violação de chave única (como email duplicado)
            if (error.name === 'SequelizeUniqueConstraintError') {
                console.warn(`Attempt to create a user with duplicate email: ${email}`);
                // Redireciona de volta para a página com uma mensagem de erro clara
                return res.redirect('/funcionarios?error=email_in_use');
            }

            // Para qualquer outro erro, exibe o erro genérico
            console.error("Error creating employee:", error);
            res.redirect('/funcionarios?error=create_failed');
        }
    },

    update: async (req, res) => {
        const { tenantId } = req;
        const { id } = req.params;
        const { name, email, position, role } = req.body;
        
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Employee } = db.initialize(sequelize);

            const employee = await Employee.findByPk(id);
            if (!employee) return res.status(404).send('Funcionário não encontrado.');

            const dataToUpdate = { name, email, position, role };

            if (req.file) {
                dataToUpdate.photo = req.file.buffer;
            }


            await employee.update(dataToUpdate);
            res.redirect('/funcionarios?success=updated');
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                console.warn(`Attempt to create a user with duplicate email: ${email}`);
                // Redireciona de volta para a página com uma mensagem de erro clara
                return res.redirect('/funcionarios?error=email_in_use');
            }

            // Para qualquer outro erro, exibe o erro genérico
            console.error("Error creating employee:", error);
            res.redirect('/funcionarios?error=create_failed');
        }
    },

    /**
     * Deleta um funcionário.
     */
    destroy: async (req, res) => {
        const { tenantId } = req;
        const { id } = req.params;
        try {
            const sequelize = await getTenantDB(tenantId);
            const { Employee } = db.initialize(sequelize);

            const employee = await Employee.findByPk(id);
            if (!employee) return res.status(404).send('Funcionário não encontrado.');

            await employee.destroy();
            res.redirect('/funcionarios?success=deleted');
        } catch (error) {
            // ===============================================
            //           TRATAMENTO DE ERRO APRIMORADO 👇
            // ===============================================
            if (error.name === 'SequelizeForeignKeyConstraintError') {
                return res.redirect('/funcionarios?error=employee_in_use');
                a
            }
            console.error("Error deleting employee:", error);
            res.redirect('/funcionarios?error=delete_failed');
        }
    }
};

module.exports = employeeController;