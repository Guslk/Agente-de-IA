// controllers/dashboardController.js

const Ferramenta = require('../models/Ferramenta');

const dashboardController = {
    showDashboard: (req, res) => {
        // Busca as duas listas de ferramentas usando o Model
        const ferramentasDisponiveis = Ferramenta.findDisponiveis();
        const ferramentasRetiradas = Ferramenta.findRetiradas();

        // Renderiza a view 'index', passando as duas listas de dados
        res.render('index', { 
    disponiveis: ferramentasDisponiveis,
    retiradas: ferramentasRetiradas,
    paginaAtiva: 'ferramentas' 
});
    }
};

module.exports = dashboardController;