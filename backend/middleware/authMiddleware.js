// middleware/authMiddleware.js

const isAuthenticated = (req, res, next) => {
    // Verifica se a sessão existe e se o usuário está logado
    if (req.session && req.session.loggedIn) {
        // Se estiver logado, permite que a requisição continue
        return next();
    } else {
        // Se não estiver logado, redireciona para a página de login
        res.redirect('/login');
    }
};

module.exports = isAuthenticated;