// controllers/funcionarioController.js

const Funcionario = require('../models/Funcionario');

const funcionarioController = {
    getAllFuncionarios: (req, res) => {
        try {
            // Pega a lista de todos os funcionários (como antes)
            const todosFuncionarios = Funcionario.findAll();
            
            // Pega os dados do usuário atualmente logado a partir da sessão
            const currentUser = Funcionario.findByEmail(req.session.user.email);

            res.render('funcionarios', { 
                funcionarios: todosFuncionarios,
                currentUser: currentUser, // Envia os dados do usuário logado para a view
                paginaAtiva: 'funcionarios'
            });
        } catch (error) {
            console.error("Erro ao buscar funcionários:", error);
            res.status(500).send("Ocorreu um erro ao buscar os funcionários.");
        }
    }
};

module.exports = funcionarioController;