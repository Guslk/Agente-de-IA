// server.js

// Importações
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Configurar o EJS como o motor de templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// 3. Middlewares para processar dados de formulário (útil para login/cadastro)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 4. Rotas 

app.get('/', (req, res) => {
    // res.render() procura por um arquivo na pasta /views
    // e o processa com o EJS
    res.render('index'); // Renderiza o arquivo views/index.ejs
});



// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

const itemRoutes = require('./routes/itemRoutes'); 

app.get('/', (req, res) => {
    res.render('index'); 
});

app.use('/itens', itemRoutes);


const movimentacaoRoutes = require('./routes/movimentacaoRoutes'); 

app.get('/', (req, res) => {
    res.render('index', { paginaAtiva: 'dashboard' }); 
});

app.use('/itens', itemRoutes);
app.use('/movimentacoes', movimentacaoRoutes); 
