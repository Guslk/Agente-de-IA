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

// 4. Rotas (ainda vamos criá-las)
// Exemplo para a página inicial:
app.get('/', (req, res) => {
    // res.render() procura por um arquivo na pasta /views
    // e o processa com o EJS
    res.render('index'); // Renderiza o arquivo views/index.ejs
});

// Outras rotas virão aqui...
// app.use('/itens', require('./routes/itemRoutes'));
// app.use('/login', require('./routes/authRoutes'));

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
// server.js

// ... (todo o código de configuração que já está lá) ...

// 4. Rotas
const itemRoutes = require('./routes/itemRoutes'); // << ADICIONE ESTA LINHA

app.get('/', (req, res) => {
    res.render('index'); 
});

app.use('/itens', itemRoutes); // << ADICIONE ESTA LINHA

// ... (o resto do seu código, como app.listen) ...
// server.js

// ... (todo o código de configuração que já está lá) ...

// 4. Rotas
const movimentacaoRoutes = require('./routes/movimentacaoRoutes'); // << ADICIONE ESTA LINHA

app.get('/', (req, res) => {
    res.render('index', { paginaAtiva: 'dashboard' }); 
});

app.use('/itens', itemRoutes);
app.use('/movimentacoes', movimentacaoRoutes); // << ADICIONE ESTA LINHA

// ... (o resto do seu código) ...