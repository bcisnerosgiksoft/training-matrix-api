const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../models/mongo/blacklistedToken.model');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token)
        return res.status(403).json({ message: 'Token no proporcionado' });

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        req.user = decoded; // Guardamos los datos del token en `req.user`
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

const validateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    try {
        // ⛔ Verificamos si el token está en la blacklist
        const blacklisted = await BlacklistedToken.findOne({ token });
        if (blacklisted) {
            return res.status(401).json({ message: 'Token inválido o expirado (blacklist)' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token inválido o expirado' });
    }
};


module.exports = { verifyToken, validateToken };
