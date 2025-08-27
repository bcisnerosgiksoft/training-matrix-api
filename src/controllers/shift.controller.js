const Shift = require('../models/mysql/shift.model');
const { createLog } = require('../utils/log.helper');
const { notifyUser } = require('../utils/notify.helper');
const {Op} = require("sequelize");

const getAll = async (req, res) => {
    try {
        const q = req.query.q || '';

        // Traemos todas, incluidas inactivas (soft deleted)
        const shifts = await Shift.findAll({
            where: q ? { name: { [Op.like]: `%${q}%` } } : undefined,
            order: [['name', 'ASC']],
            paranoid: false // 👈 incluir también las eliminadas
        });

        const results = shifts.map(cls => ({
            id: cls.id,
            name: cls.name,
            start_time: cls.start_time,
            end_time: cls.end_time,
            is_active: cls.deletedAt === null // 👈 activo/inactivo
        }));

        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener turnos' });
    }
};

const getOne = async (req, res) => {
    try {
        const { id } = req.params;
        const shift = await Shift.findByPk(id);

        if (!shift) return res.status(404).json({ message: 'Turno no encontrado' });

        res.json(shift);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener turno' });
    }
};

const create = async (req, res) => {
    try {
        const { name, start_time, end_time } = req.body;

        const newShift = await Shift.create({ name, start_time, end_time });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'create',
            module: 'shifts',
            description: `Turno "${name}" creado`,
            ip: req.ip
        });

        await notifyUser({
            user_id: req.user.id,
            title: 'Nuevo turno creado',
            message: `Se ha creado el turno "${name}" con horario ${start_time} a ${end_time}`
        });

        res.status(201).json({ message: 'Turno creado', shift: newShift });

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: `Ya existe un turno con el nombre "${req.body.name}"` });
        }

        console.error(error);
        res.status(500).json({ message: 'Error al crear turno' });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, start_time, end_time } = req.body;

        const shift = await Shift.findByPk(id);
        if (!shift) {
            return res.status(404).json({ message: 'Turno no encontrado' });
        }

        await Shift.update({ name, start_time, end_time }, { where: { id } });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'update',
            module: 'shifts',
            description: `Turno actualizado a "${name}"`,
            ip: req.ip
        });

        await notifyUser({
            user_id: req.user.id,
            title: 'Turno actualizado',
            message: `El turno con ID ${id} fue actualizado a "${name}" con horario ${start_time} a ${end_time}`
        });

        res.json({ message: 'Turno actualizado correctamente', shift });

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: `Ya existe un turno con el nombre "${req.body.name}"` });
        }

        console.error(error);
        res.status(500).json({ message: 'Error al actualizar turno' });
    }
};
const restore = async (req, res) => {
    try {
        const { id } = req.params;
        const turno = await Shift.findByPk(id, { paranoid: false }); // 👈 importante incluir inactivas
        if (!turno) return res.status(404).json({ message: 'Turno no encontrado' });

        await turno.restore();

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'restore',
            module: 'shifts',
            description: `Turno con ID ${id} restaurado`,
            ip: req.ip
        });

        res.json({ message: 'Turno restaurado', shift: turno });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al restaurar turno' });
    }
};

const deleteShift = async (req, res) => {
    try {
        const { id } = req.params;

        const shift = await Shift.findByPk(id);
        if (!shift) return res.status(404).json({ message: 'Turno no encontrado' });

        await Shift.destroy({ where: { id } });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'delete',
            module: 'shifts',
            description: `Turno "${shift.name}" eliminado (ID ${id})`,
            ip: req.ip
        });

        await notifyUser({
            user_id: req.user.id,
            title: 'Turno eliminado',
            message: `Se ha eliminado el turno "${shift.name}" (ID ${id})`
        });

        res.json({ message: 'Turno eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar turno' });
    }
};

module.exports = {
    getAll,
    getOne,
    create,
    update,
    delete: deleteShift,
    restore
};
