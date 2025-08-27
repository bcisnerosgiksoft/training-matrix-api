const User = require('../models/mysql/user.model');
const Role = require('../models/mysql/role.model');
const { createLog } = require('../utils/log.helper');
const { addTokenToBlacklist } = require('../utils/token.helper');
const { notifyUser } = require('../utils/notify.helper');

const bcrypt = require('bcryptjs');

const getAll = async (req, res) => {
    try {
        const users = await User.findAll({ where: {}, paranoid: true });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

const getOne = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { id: req.params.id },
            paranoid: true // Asegura que no se devuelvan usuarios eliminados
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el usuario' });
    }
};

const create = async (req, res) => {
    try {
        const { first_name, last_name, middle_name, username, password, role_id } = req.body;

        // Verificar si los campos requeridos están presentes
        if (!first_name || !last_name || !username || !password || !role_id) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Verificar si el role_id existe en la tabla roles
        const role = await Role.findOne({ where: { id: role_id } });
        if (!role) {
            return res.status(400).json({ message: 'El role_id no existe' });
        }

        // Generar un user_code único
        const userCode = `U${Date.now()}`;  // Genera un código único basado en el timestamp (puedes personalizar esto)

        const newUser = await User.create({
            user_code: userCode,  // Asignamos el user_code generado
            first_name,
            last_name,
            middle_name,
            username,
            password: hashedPassword,
            role_id
        });

        await notifyUser({
            user_id: 1, // El ID del usuario administrador o receptor
            title: 'Nuevo usuario registrado',
            message: `Se ha creado el usuario ${newUser.username} con ID ${newUser.id}`
        });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username, // o req.user.full_name
            action: 'create',
            module: 'users',
            description: `Usuario ${newUser.username} creado (ID ${newUser.id})`,
            ip: req.ip
        });

        res.status(201).json({ message: 'Usuario registrado', user: newUser });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error al crear usuario', error: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Verificar si la contraseña está presente y encriptarla
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);

            // ⚠️ Invalidamos el token actual si el usuario cambia la contraseña
            const authHeader = req.headers['authorization'];
            const token = authHeader?.split(' ')[1];

            if (token) {
                await addTokenToBlacklist(token, req.user.id, 'password_change');
            }
        }

        // Verificar si el campo middle_name fue incluido, incluso si es null
        if (data.middle_name === null) {
            data.middle_name = null;
        }

        const [updated] = await User.update(data, { where: { id } });

        if (updated) {
            const updatedUser = await User.findOne({ where: { id } });

            await notifyUser({
                user_id: 1,
                title: 'Usuario actualizado',
                message: `El usuario ${updatedUser.username} fue modificado por ${req.user.username}`
            });

            await createLog({
                user_id: req.user.id,
                user_name: req.user.username, // o req.user.full_name
                action: 'update',
                module: 'users',
                description: `Usuario ${updatedUser.username} actualizado (ID ${updatedUser.id})`,
                ip: req.ip
            });

            res.json({ message: 'Usuario actualizado', user: updatedUser });
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
};


const softDelete = async (req, res) => {
    try {
        const { id } = req.params;
        await User.destroy({ where: { id } });

        await notifyUser({
            user_id: 1,
            title: 'Usuario eliminado',
            message: `El usuario con ID ${id} fue eliminado por ${req.user.username}`
        });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'delete',
            module: 'users',
            description: `Usuario con ID ${id} eliminado (soft delete)`,
            ip: req.ip
        });

        res.json({ message: 'Usuario eliminado (soft delete)' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar usuario' });
    }
};


module.exports = {
    getAll,
    getOne,
    create,
    update,
    softDelete
};
