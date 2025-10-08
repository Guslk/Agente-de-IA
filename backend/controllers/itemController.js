// controllers/itemController.js

const Item = require('../models/item');

const itemController = {
    getAllItems: (req, res) => {
        try {
            const { busca, filtroStatus } = req.query;
            const items = Item.findAll({ busca, filtroStatus });
            
            res.render('itens', { 
                items: items,
                paginaAtiva: 'itens',
                busca: busca || '',
                filtroStatus: filtroStatus || 'todos',
                user: req.session.user // Passa os dados do usuário para a view
            });
        } catch (error) {
            console.error("Erro ao buscar itens:", error);
            res.status(500).send("Ocorreu um erro ao buscar os itens.");
        }
    },

    createItem: (req, res) => {
        try {
            Item.create(req.body);
            res.redirect('/itens');
        } catch (error) {
            console.error("Erro ao criar item:", error);
            res.status(500).send("Ocorreu um erro ao criar o item.");
        }
    },

    updateItem: (req, res) => {
        try {
            const { id } = req.params;
            Item.updateById(id, req.body);
            res.redirect('/itens');
        } catch (error) {
            console.error("Erro ao atualizar item:", error);
            res.status(500).send("Ocorreu um erro ao atualizar o item.");
        }
    },

    deleteItem: (req, res) => {
        try {
            const { id } = req.params;
            Item.deleteById(id);
            res.redirect('/itens');
        } catch (error) {
            console.error("Erro ao deletar item:", error);
            res.status(500).send("Ocorreu um erro ao deletar o item.");
        }
    },

    registrarSaida: (req, res) => {
        try {   
            const { id } = req.params;
            Item.darSaida(id, req.body);
            res.redirect('/itens');
        } catch (error) {
            console.error("Erro ao registrar saída de item:", error);
            res.status(500).send("Ocorreu um erro ao registrar a saída.");
        }
    }
};

module.exports = itemController;

// // controllers/itemController.js
// const db = require('../models/itemm');
// const Item = db.Item;


// // controllers/itemController.js

// // Importe a instância do sequelize e os modelos necessários no topo do arquivo
// const { sequelize, itemm, stockEntry } = require('../models'); // Ajuste o caminho se necessário

// // Sua função create ATUALIZADA
// exports.create = async (req, res) => {
//     // #swagger.tags = ['Items']

//     // Inicia uma transação
//     const t = await sequelize.transaction();

//     try {
//         // 1. Separa os dados que vêm do formulário (req.body)
//         const dadosItem = {
//             nome: req.body.nome,
//             codigo_barras: req.body.codigo_barras,
//             quantidade_atual: req.body.quantidade_atual,
//             quantidade_minima: req.body.quantidade_minima,
//             preco_unitario: req.body.preco_unitario,
//             categoria: req.body.categoria,
//             unidade_medida: req.body.unidade_medida,
//             descricao: req.body.descricao
//         };

//         const dadosEntrada = {
//             nota_fiscal_codigo: req.body.nota_fiscal_codigo,
//             nota_fiscal_link: req.body.nota_fiscal_link,
//             quantidade: req.body.quantidade_atual, // A quantidade da entrada é a inicial do item
//             tipo: 'entrada' // Define o tipo de movimentação
//             // id_usuario: req.user.id // Se você tiver um sistema de login, é bom registrar quem fez a entrada
//         };

//         // 2. Cria o Item dentro da transação
//         const novoItem = await Item.create(dadosItem, { transaction: t });

//         // 3. Pega o ID do item recém-criado e o usa para criar a Entrada
//         dadosEntrada.id_item = novoItem.id_item; // Vincula a entrada ao item!

//         // 4. Cria o registro de Entrada, também na mesma transação
//         await Entrada.create(dadosEntrada, { transaction: t });

//         // 5. Se tudo deu certo, confirma as operações no banco de dados
//         await t.commit();

//         // 6. Redireciona o usuário de volta para a lista de itens com uma mensagem de sucesso
//         res.redirect('/itens?sucesso=true');

//     } catch (error) {
//         // 7. Se qualquer passo deu errado, desfaz todas as operações
//         await t.rollback();

//         console.error("Erro ao cadastrar item e entrada:", error);
//         // Envia uma resposta de erro ou redireciona com mensagem
//         res.status(500).send({ message: "Erro ao salvar o item. " + error.message });
//     }
// };


// // 1. Criar um novo Item (Create)
// exports.create = async (req, res) => {
//     // #swagger.tags = ['Items']
//     try {
//         const item = await Item.create(req.body);
//         res.status(201).send(item);
//     } catch (error) {
//         res.status(400).send({ message: error.message });
//     }
// };

// // 2. Obter todos os Itens (Read)
// exports.getAll = async (req, res) => {
//     // #swagger.tags = ['Items']
//     try {
//         const items = await Item.findAll();
//         res.status(200).send(items);
//     } catch (error) {
//         res.status(500).send({ message: error.message });
//     }
// };

// // 3. Obter um Item por ID (Read)
// exports.getById = async (req, res) => {
//     // #swagger.tags = ['Items']
//     try {
//         const item = await Item.findByPk(req.params.id);
//         if (item) {
//             res.status(200).send(item);
//         } else {
//             res.status(404).send({ message: 'Item not found.' });
//         }
//     } catch (error) {
//         res.status(500).send({ message: error.message });
//     }
// };

// // 4. Atualizar um Item (Update)
// exports.update = async (req, res) => {
//     // #swagger.tags = ['Items']
//     try {
//         const item = await Item.findByPk(req.params.id);
//         if (item) {
//             await item.update(req.body);
//             res.status(200).send(item);
//         } else {
//             res.status(404).send({ message: 'Item not found.' });
//         }
//     } catch (error) {
//         res.status(400).send({ message: error.message });
//     }
// };

// // 5. Deletar um Item (Delete)
// exports.delete = async (req, res) => {
//     // #swagger.tags = ['Items']
//     try {
//         const item = await Item.findByPk(req.params.id);
//         if (item) {
//             await item.destroy();
//             res.status(204).send(); // 204 No Content
//         } else {
//             res.status(404).send({ message: 'Item not found.' });
//         }
//     } catch (error) {
//         res.status(500).send({ message: error.message });
//     }
// };