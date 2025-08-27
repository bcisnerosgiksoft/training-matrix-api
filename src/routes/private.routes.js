const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/perfil', verifyToken, (req, res) => {
    res.json({
        message: 'Ruta protegida',
        usuario: req.user
    });
});

module.exports = router;
