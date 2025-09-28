// controllers/dashboardController.js

const Ferramenta = require('../models/Ferramenta');

const dashboardController = {
    showDashboard: (req, res) => {
        const ferramentasDisponiveis = Ferramenta.findDisponiveis();
        const ferramentasRetiradas = Ferramenta.findRetiradas();
        res.render('index', { 
            disponiveis: ferramentasDisponiveis,
            retiradas: ferramentasRetiradas,
            paginaAtiva: 'ferramentas' 
        });
    },

    // NOVA FUNÇÃO para lidar com a retirada
    retirarFerramenta: (req, res) => {
        const { id } = req.params; // Pega o ID da ferramenta da URL
        const { nome } = req.body; // Pega o nome da pessoa do formulário do modal
        
        Ferramenta.retirar(id, nome);
        
        res.redirect('/'); // Redireciona de volta para o dashboard
    },

    // NOVA FUNÇÃO para lidar com a devolução
    devolverFerramenta: (req, res) => {
        const { id } = req.params; // Pega o ID da ferramenta da URL
        
        Ferramenta.devolver(id);
        
        res.redirect('/'); // Redireciona de volta para o dashboard
    }
};

module.exports = dashboardController;