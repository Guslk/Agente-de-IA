// controllers/authController.js

const authController = {
    // Função para MOSTRAR a página de login
    showLoginPage: (req, res) => {
        // Renderiza o arquivo 'login.ejs' da pasta views
        // Passamos um objeto vazio ou com um erro nulo na primeira vez
        res.render('login', { error: null });
    },

    // Função para PROCESSAR a tentativa de login
    loginUser: (req, res) => {
    const { email, password } = req.body;

    if (email === 'admin@stockex.com' && password === '1234') {
        // Se o login for bem-sucedido, CRIAMOS a sessão
        req.session.user = { 
            email: email, 
            role: 'admin' // Você pode adicionar mais dados do usuário aqui
        };
        req.session.loggedIn = true;

        // E então redirecionamos
        res.redirect('/');
    } else {
        const errorMessage = 'Credenciais inválidas. Por favor, tente novamente.';
        res.render('login', { error: errorMessage });
    }
}};

module.exports = authController;