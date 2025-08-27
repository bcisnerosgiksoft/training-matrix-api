const Class = require('../models/mysql/class.model');
const { createLog } = require('../utils/log.helper');
const { notifyUser } = require('../utils/notify.helper');
const { Op } = require('sequelize');

const getAll = async (req, res) => {
    try {
        const q = req.query.q || '';

        // Traemos todas, incluidas inactivas (soft deleted)
        const classes = await Class.findAll({
            where: q ? { name: { [Op.like]: `%${q}%` } } : undefined,
            order: [['name', 'ASC']],
            paranoid: false // 👈 incluir también las eliminadas
        });

        const results = classes.map(cls => ({
            id: cls.id,
            name: cls.name,
            is_active: cls.deletedAt === null // 👈 activo/inactivo
        }));

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener clases' });
    }
};

const getOne = async (req, res) => {
    try {
        const { id } = req.params;
        const clase = await Class.findByPk(id);
        if (!clase) return res.status(404).json({ message: 'Clase no encontrada' });
        res.json(clase);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener clase' });
    }
};

const create = async (req, res) => {
    try {
        const { name } = req.body;

        const exists = await Class.findOne({ where: { name } });
        if (exists) {
            return res.status(409).json({ message: 'Ya existe una clase con ese nombre' });
        }

        const clase = await Class.create({ name });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'create',
            module: 'classes',
            description: `Clase "${name}" creada`,
            ip: req.ip
        });

        await notifyUser({
            user_id: 1,
            title: 'Clase creada',
            message: `Se creó la clase "${name}"`
        });

        res.status(201).json({ message: 'Clase creada', class: clase });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear clase' });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const exists = await Class.findOne({ where: { name, id: { [require('sequelize').Op.ne]: id } } });
        if (exists) {
            return res.status(409).json({ message: 'Ya existe una clase con ese nombre' });
        }

        const clase = await Class.findByPk(id);
        if (!clase) return res.status(404).json({ message: 'Clase no encontrada' });

        clase.name = name;
        await clase.save();

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'update',
            module: 'classes',
            description: `Clase con ID ${id} actualizada a "${name}"`,
            ip: req.ip
        });

        res.json({ message: 'Clase actualizada', class: clase });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar clase' });
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Class.destroy({ where: { id } });

        if (!deleted) return res.status(404).json({ message: 'Clase no encontrada' });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'delete',
            module: 'classes',
            description: `Clase con ID ${id} eliminada`,
            ip: req.ip
        });

        res.json({ message: 'Clase eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar clase' });
    }
};

const restore = async (req, res) => {
    try {
        const { id } = req.params;
        const clase = await Class.findByPk(id, { paranoid: false }); // 👈 importante incluir inactivas
        if (!clase) return res.status(404).json({ message: 'Clase no encontrada' });

        await clase.restore();

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'restore',
            module: 'classes',
            description: `Clase con ID ${id} restaurada`,
            ip: req.ip
        });

        res.json({ message: 'Clase restaurada', class: clase });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al restaurar clase' });
    }
};


module.exports = {
    getAll,
    getOne,
    create,
    update,
    delete: remove,
    restore
};
