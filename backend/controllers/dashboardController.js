// controllers/dashboardController.js

const dashboardController = {
    showDashboard: (req, res) => {
        // A lógica que estava no server.js agora fica aqui
        res.render('index', { paginaAtiva: 'dashboard' });
    }
};

module.exports = dashboardController;