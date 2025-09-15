// controllers/dashboardController.js

const dashboardController = {
    showDashboard: (req, res) => {       
        res.render('index', { paginaAtiva: 'dashboard' });
    }
};

module.exports = dashboardController;