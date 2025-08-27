const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/mysql/user.model');
const Role = require('../models/mysql/role.model');
const { createLog } = require('../utils/log.helper');

let userCodeCounter = 1;

const register = async (req, res) => {
    try {
        const { first_name, last_name, middle_name, username, password, role_id } = req.body;

        if (!first_name || !last_name || !username || !password || !role_id) {
            return res.status(400).json({ message: 'Faltan campos obligatorios.' });
        }

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user_code = `U${userCodeCounter.toString().padStart(4, '0')}`;
        userCodeCounter++;

        const newUser = await User.create({
            user_code,
            first_name,
            last_name,
            middle_name,
            username,
            password: hashedPassword,
            role_id
        });

        await createLog({
            user_id: newUser.id,
            action: 'register',
            module: 'auth',
            description: `Usuario ${newUser.username} registrado con rol ID ${role_id}`,
            ip: req.ip
        });

        return res.status(201).json({ message: 'Usuario registrado', user: newUser });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password)
            return res.status(400).json({ message: 'Usuario y contraseña requeridos.' });

        const user = await User.findOne({ where: { username }, include: Role });
        if (!user)
            return res.status(404).json({ message: 'Usuario no encontrado.' });

        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.status(401).json({ message: 'Contraseña incorrecta.' });

        const token = jwt.sign(
            {
                id: user.id,
                user_code: user.user_code,
                username: user.username,
                role: user.Role.name,
                permissions: {
                    read: user.Role.can_read,
                    write: user.Role.can_write,
                    edit: user.Role.can_edit,
                    delete: user.Role.can_delete
                }
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        await createLog({
            user_id: user.id,
            action: 'login',
            module: 'auth',
            description: `Usuario ${user.username} inició sesión`,
            ip: req.ip
        });

        res.json({
            message: 'Login exitoso',
            token,
            role_id: user.role_id,         // 👈 Agregamos esto
            role: user.Role.name           // 👈 Y esto también, si quieres usar el nombre directamente
        });
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = {
    register,
    login
};
