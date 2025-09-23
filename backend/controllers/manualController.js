// controllers/manualController.js

const manualController = {
    showManual: (req, res) => {
        res.render('manual', {
            paginaAtiva: 'manual' 
        });
    }
};

module.exports = manualController;