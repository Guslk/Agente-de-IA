// middleware/authMiddleware.js

const authMiddleware = {
    /**
     * Garante que o usuário esteja logado.
     */
    isAuthenticated: (req, res, next) => {
        if (req.session && req.session.user) {
            return next();
        }
        res.redirect('/login?error=not_authenticated');
    },

    /**
     * Garante que o usuário logado seja um Administrador.
     */
    isAdministrator: (req, res, next) => {
        if (req.session.user && req.session.user.role === 'Administrador') {
            return next();
        }
        res.status(403).send('Acesso negado. Somente administradores.');
    }

    // Você pode adicionar mais regras aqui, como 'isOperator', etc.
};

module.exports = authMiddleware;