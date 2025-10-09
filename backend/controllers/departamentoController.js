// controllers/departamentoController.js
const Departamento = require('../models/Departamento');

const departamentoController = {
    create: (req, res) => {
        try {
            // req.body terá o campo 'nome' do formulário
            Departamento.create(req.body);
            // Redireciona de volta para a página de itens, de onde a ação partiu
            res.redirect('/itens');
        } catch (error) {
            res.status(500).send("Erro ao criar departamento.");
        }
    }
};

module.exports = departamentoController;