const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');
const { validateToken } = require('../middlewares/auth.middleware');
const BlacklistedToken = require('../models/mongo/blacklistedToken.model');


router.post('/register', register);
router.post('/login', login);
// 🔒 Logout (blacklist del token actual)
router.post('/logout', validateToken, async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1];

        await BlacklistedToken.create({
            token,
            user_id: req.user.id,
            reason: 'logout',
            expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24) // 24h (ajústalo si tu JWT expira antes)
        });

        res.json({ message: 'Sesión cerrada exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al cerrar sesión' });
    }
});



module.exports = router;
