// controllers/funcionarioController.js

const Funcionario = require('../models/Funcionario');

const funcionarioController = {
    // Função para buscar todos os funcionários e renderizar a página
    getAllFuncionarios: (req, res) => {
        const funcionarios = Funcionario.findAll();

        res.render('funcionarios', {
            funcionarios: funcionarios,
            paginaAtiva: 'funcionarios' 
        });
    }
};

module.exports = funcionarioController;