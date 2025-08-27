const Position = require('../models/mysql/position.model');
const { createLog } = require('../utils/log.helper'); // 👈 Importa el log
const { Op } = require('sequelize');

const getAll = async (req, res) => {
    try {
        const q = req.query.q || '';

        // Traemos todas, incluidas inactivas (soft deleted)
        const positions = await Position.findAll({
            where: q ? { name: { [Op.like]: `%${q}%` } } : undefined,
            order: [['name', 'ASC']],
            paranoid: false // 👈 incluir también las eliminadas
        });

        const results = positions.map(cls => ({
            id: cls.id,
            name: cls.name,
            description: cls.description,   // si tienes más columnas
            is_active: cls.deletedAt === null // 👈 activo/inactivo
        }));

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener puestos' });
    }
};
const getOne = async (req, res) => {
    try {
        const { id } = req.params;
        const position = await Position.findOne({ where: { id } });
        if (!position) {
            return res.status(404).json({ message: 'Puesto no encontrado' });
        }
        res.json(position);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener la posición' });
    }
};
const create = async (req, res) => {
    try {
        const { name, description, base_salary } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }

        const newPosition = await Position.create({
            name,
            description: description || null,
            base_salary: base_salary || null
        });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'create',
            module: 'positions',
            description: `Puesto creado: ${name}${base_salary ? ` con salario base ${base_salary}` : ''}`,
            ip: req.ip
        });

        res.status(201).json({ message: 'Puesto creado', position: newPosition });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear posición' });
    }
};
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, base_salary } = req.body;

        // Buscar el puesto (incluyendo inactivos por paranoid:false)
        const position = await Position.findByPk(id, { paranoid: false });
        if (!position) {
            return res.status(404).json({ message: 'Puesto no encontrado' });
        }

        // Actualizar campos
        await Position.update(
            {
                name,
                description: description || null,
                base_salary: base_salary || null
            },
            { where: { id } }
        );

        // Traer de nuevo el registro ya actualizado
        const updatedPosition = await Position.findByPk(id, { paranoid: false });

        // Guardar log
        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'update',
            module: 'positions',
            description: `Puesto actualizado (ID ${id}): ${name}`,
            ip: req.ip
        });

        // Respuesta al cliente con is_active calculado
        res.json({
            message: 'Puesto actualizado',
            position: {
                id: updatedPosition.id,
                name: updatedPosition.name,
                description: updatedPosition.description,
                base_salary: updatedPosition.base_salary,
                is_active: updatedPosition.deletedAt === null // 👈 se deriva del paranoid
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar posición' });
    }
};

const restore = async (req, res) => {
    try {
        const { id } = req.params;
        const puesto = await Position.findByPk(id, { paranoid: false }); // 👈 importante incluir inactivas
        if (!puesto) return res.status(404).json({ message: 'Puesto no encontrado' });

        await puesto.restore();

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'restore',
            module: 'positions',
            description: `Puesto con ID ${id} restaurado`,
            ip: req.ip
        });

        res.json({ message: 'Puesto restaurado', position: puesto });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al restaurar puesto' });
    }
};

const deletePosition = async (req, res) => {
    try {
        const { id } = req.params;

        const position = await Position.findOne({ where: { id } });
        if (!position) {
            return res.status(404).json({ message: 'Puesto no encontrado' });
        }

        await Position.destroy({ where: { id } });

        // ✅ Log de eliminación
        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'delete',
            module: 'positions',
            description: `Puesto eliminado: ${position.name}`,
            ip: req.ip
        });

        res.json({ message: 'Puesto eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar posición' });
    }
};
module.exports = {
    getAll,
    getOne,
    create,
    update,
    delete: deletePosition,
    restore
};
