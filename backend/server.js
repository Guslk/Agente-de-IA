// server.js

const express = require('express');
const path = require('path');

// Importação de todas as rotas em um só lugar
const dashboardRoutes = require('./routes/dashboardRoutes');
const itemRoutes = require('./routes/itemRoutes');
const movimentacaoRoutes = require('./routes/movimentacaoRoutes');
const fornecedorRoutes = require('./routes/fornecedorRoutes');
const funcionarioRoutes = require('./routes/funcionarioRoutes');
const relatorioRoutes = require('./routes/relatorioRoutes');


const app = express();
const PORT = process.env.PORT || 3000;

// Configurar o EJS como o motor de templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares para processar dados de formulário
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use('/', dashboardRoutes);
app.use('/itens', itemRoutes);
app.use('/movimentacoes', movimentacaoRoutes);
app.use('/fornecedores', fornecedorRoutes);
app.use('/funcionarios', funcionarioRoutes);
app.use('/relatorios', relatorioRoutes);
// Adicione a rota para o agente de IA aqui quando for implementar



app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});