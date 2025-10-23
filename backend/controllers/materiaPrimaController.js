// // controllers/materiaPrimaController.js

// const MateriaPrima = require('../models/materia');
// const Funcionario = require('../models/Funcionario'); // << 1. IMPORTAR O MODEL DE FUNCIONÁRIO

// const materiaPrimaController = {
//     listar: (req, res) => {
//         try {
//             const todosMateriais = MateriaPrima.findAll();
//             const todosFuncionarios = Funcionario.findAll(); // << 2. BUSCAR TODOS OS FUNCIONÁRIOS

//             res.render('materiais', {
//                 materiais: todosMateriais,
//                 funcionarios: todosFuncionarios, // << 3. ENVIAR A LISTA PARA A VIEW
//                 paginaAtiva: 'materiais',
//                 user: req.session.user
//             });
//         } catch(error) {
//             console.error("Erro ao listar materiais:", error);
//             res.status(500).send("Erro ao carregar a página.");
//         }
//     },
//     create: (req, res) => {
//         try {
//             MateriaPrima.create(req.body);
//             res.redirect('/materiais');
//         } catch(error) {
//             console.error("Erro ao criar material:", error);
//             res.status(500).send("Erro ao criar material.");
//         }
//     },
//     consumir: (req, res) => {
//         try {
//             const { id } = req.params;
//             MateriaPrima.consumir(id, req.body);
//             res.redirect('/materiais');
//         } catch(error) {
//             console.error("Erro ao consumir material:", error);
//             res.status(500).send("Erro ao consumir material.");
//         }
//     }
// };
// module.exports = materiaPrimaController;