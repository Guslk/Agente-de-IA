// controllers/dashboardController.js

const Ferramenta = require('../models/Ferramenta');
const Funcionario = require('../models/Funcionario'); // << 1. IMPORTAR O MODEL DE FUNCIONÁRIO

const dashboardController = {
    showDashboard: (req, res) => {
        try {
            const ferramentasDisponiveis = Ferramenta.findDisponiveis();
            const ferramentasRetiradas = Ferramenta.findRetiradas();
            const todosFuncionarios = Funcionario.findAll(); // << 2. BUSCAR TODOS OS FUNCIONÁRIOS

            res.render('index', { 
                disponiveis: ferramentasDisponiveis,
                retiradas: ferramentasRetiradas,
                funcionarios: todosFuncionarios, // << 3. ENVIAR A LISTA PARA A VIEW
                paginaAtiva: 'ferramentas',
                user: req.session.user
            });
        } catch(error) {
            console.error("Erro ao carregar o dashboard:", error);
            res.status(500).send("Erro ao carregar o dashboard.");
        }
    },

    createFerramenta: (req, res) => {
        try {
            Ferramenta.create(req.body);
            res.redirect('/'); // Redireciona de volta para o dashboard atualizado
        } catch(error) {
            console.error("Erro ao cadastrar ferramenta:", error);
            res.status(500).send("Erro ao cadastrar ferramenta.");
        }
    },

    retirarFerramenta: (req, res) => {
        try {
            const { id } = req.params;
            const { nome } = req.body; // O nome agora virá do <select>
            
            Ferramenta.retirar(id, nome);
            
            res.redirect('/');
        } catch(error) {
            console.error("Erro ao retirar ferramenta:", error);
            res.status(500).send("Erro ao retirar ferramenta.");
        }
    },

    devolverFerramenta: (req, res) => {
        try {
            const { id } = req.params;
            
            Ferramenta.devolver(id);
            
            res.redirect('/');
        } catch(error) {
            console.error("Erro ao devolver ferramenta:", error);
            res.status(500).send("Erro ao devolver ferramenta.");
        }
    }
};

module.exports = dashboardController;