// controllers/authController.js

const authController = {
    showLoginPage: (req, res) => {
        res.render('login', { error: null });
    },

    loginUser: (req, res) => {
        const { email, password } = req.body;

        if (email === 'admin@stockex.com' && password === '1234') {
            req.session.user = { 
                email: email, 
                role: 'admin'
            };
            req.session.loggedIn = true;
            res.redirect('/');
        } else {
            const errorMessage = 'Credenciais inválidas. Por favor, tente novamente.';
            res.render('login', { error: errorMessage });
        }
    },
 
    logoutUser: (req, res) => {
        req.session.destroy(err => {
            if (err) {
                console.log("Erro ao destruir a sessão:", err);
                return res.redirect('/');
            }
            
            res.clearCookie('connect.sid');
            res.redirect('/login');
        });
    }
};

module.exports = authController;