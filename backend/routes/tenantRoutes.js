// // // ===================================================
// // // GESTOR DE ROTAS DO INQUILINO
// // // Este ficheiro gere todas as rotas de um inquilino.
// // // ===================================================
// // const express = require('express');
// // const router = express.Router();

// // // Importação do Middleware de Autenticação
// // const isAuthenticated = require('../middleware/authMiddleware');

// // // Importação de todas as rotas específicas de um inquilino
// // const dashboardRoutes = require('./dashboardRoutes');
// // const itemRoutes = require('./itemRoutes');
// // const movimentacaoRoutes = require('./movimentacaoRoutes');
// // const fornecedorRoutes = require('./fornecedorRoutes');
// // const funcionarioRoutes = require('./funcionarioRoutes');
// // const relatorioRoutes = require('./relatorioRoutes');
// // const authRoutes = require('./authRoutes');

// // // --- BLOCO DE VERIFICAÇÃO PARA DEBUG ---
// // // Este bloco verifica se cada ficheiro de rotas importado é uma função válida.
// // // Se não for, irá lançar um erro claro a indicar qual ficheiro está com problemas.
// // const rotas = {
// //   authRoutes,
// //   isAuthenticated,
// //   dashboardRoutes,
// //   itemRoutes,
// //   movimentacaoRoutes,
// //   fornecedorRoutes,
// //   funcionarioRoutes,
// //   relatorioRoutes,
// // };

// // for (const nomeDaRota in rotas) {
// //   if (typeof rotas[nomeDaRota] !== 'function') {
// //     throw new Error(`Erro Crítico: O módulo '${nomeDaRota}' não foi exportado corretamente. Verifique o ficheiro correspondente e certifique-se de que ele contém 'module.exports = router;' ou uma exportação de função válida.`);
// //   }
// // }
// // // --- FIM DO BLOCO DE VERIFICAÇÃO ---


// // // --- Modelação das Rotas do Inquilino ---

// // // 1. Rotas de Autenticação (Login/Logout)
// // // Estas rotas são as primeiras e não precisam do middleware 'isAuthenticated'.
// // router.use('/', authRoutes);

// // // 2. Middleware de Proteção
// // // A partir deste ponto, todas as rotas abaixo exigirão que o utilizador esteja autenticado.
// // router.use(isAuthenticated);

// // // 3. Rotas Protegidas da Aplicação
// // // Todas estas rotas só serão acessíveis a utilizadores com login feito.
// // router.use('/', dashboardRoutes);
// // router.use('/itens', itemRoutes);
// // router.use('/movimentacoes', movimentacaoRoutes);
// // router.use('/fornecedores', fornecedorRoutes);
// // router.use('/funcionarios', funcionarioRoutes);
// // router.use('/relatorios', relatorioRoutes);

// // // Exporta o router principal para ser usado no server.js
// // module.exports = router;



// // ===================================================
// // GESTOR DE ROTAS DO INQUILINO (TENANT)
// // Este ficheiro é o "coração" da aplicação para cada inquilino.
// // Depois que o middleware 'tenantIdentifier' identifica quem é o inquilino,
// // todos os pedidos são encaminhados para este ficheiro.
// // A sua função é distribuir o pedido para a rota correta.
// // ===================================================

// const express = require('express');
// const router = express.Router();

// // --- 1. IMPORTAÇÃO DE TODAS AS ROTAS DA APLICAÇÃO ---
// // Importamos todas as rotas que fazem parte da lógica de negócio.
// const dashboardRoutes = require('./dashboardRoutes');
// const itemRoutes = require('./itemRoutes');
// const movimentacaoRoutes = require('./movimentacaoRoutes');
// const fornecedorRoutes = require('./fornecedorRoutes');
// const funcionarioRoutes = require('./funcionarioRoutes');
// const relatorioRoutes = require('./relatorioRoutes');
// const authRoutes = require('./authRoutes'); // Rotas de login/logout

// // --- 2. IMPORTAÇÃO DO MIDDLEWARE DE AUTENTICAÇÃO ---
// // Este middleware irá proteger as rotas que exigem que o utilizador esteja logado.
// const isAuthenticated = require('../middleware/authMiddleware');

// // ===================================================
// // 3. DISTRIBUIÇÃO DAS ROTAS
// // ===================================================

// // --- ROTAS PÚBLICAS (Login/Registo) ---
// // Estas rotas não precisam de autenticação e vêm primeiro.
// router.use('/', authRoutes);

// // --- APLICAÇÃO DO MIDDLEWARE DE AUTENTICAÇÃO ---
// // A partir deste ponto, todas as rotas abaixo exigirão que o utilizador
// // esteja autenticado. O middleware 'isAuthenticated' irá verificar a sessão.
// router.use(isAuthenticated);

// // --- ROTAS PROTEGIDAS ---
// // O router distribui os pedidos para os ficheiros de rota corretos
// // com base no caminho do URL.
// router.use('/', dashboardRoutes); // Para a rota raiz (ex: tenant1.app.com/)
// router.use('/itens', itemRoutes); // Para rotas como tenant1.app.com/itens
// router.use('/movimentacoes', movimentacaoRoutes);
// router.use('/fornecedores', fornecedorRoutes);
// router.use('/funcionarios', funcionarioRoutes);
// router.use('/relatorios', relatorioRoutes);

// // Exportamos o router configurado para ser usado no server.js
// module.exports = router;
