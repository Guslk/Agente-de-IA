
const Fornecedor = require('../models/Fornecedor');

const fornecedorController = {

    getAllFornecedores: (req, res) => {
        const fornecedores = Fornecedor.findAll();

        res.render('fornecedores', {
            fornecedores: fornecedores,
            paginaAtiva: 'fornecedores' 
        });
    }
};

module.exports = fornecedorController;