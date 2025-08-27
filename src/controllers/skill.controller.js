// ✅ src/controllers/skill.controller.js
const Skill = require('../models/mysql/skill.model');
const Operation = require('../models/mysql/operation.model');
const Area = require('../models/mysql/area.model');
const { createLog } = require('../utils/log.helper');
const { notifyUser } = require('../utils/notify.helper');
const { Op, Sequelize } = require('sequelize');

const getAll = async (req, res) => {
    try {
        const skills = await Skill.findAll({
            include: {
                model: Operation,
                attributes: ['id', 'name', 'is_critical'], // Incluimos ID y nombre de la operación
                include: {
                    model: require('../models/mysql/area.model'), // <- Incluye también el área
                    attributes: ['id', 'name'] // Solo id y nombre del área
                }
            }
        });

        res.json(skills);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener habilidades' });
    }
};
const getOne = async (req, res) => {
    try {
        const skill = await Skill.findByPk(req.params.id);
        if (!skill) return res.status(404).json({ message: 'Habilidad no encontrada' });
        res.json(skill);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener habilidad' });
    }
};
const create = async (req, res) => {
    try {
        const { name, operation_id } = req.body;

        const newSkill = await Skill.create({ name, operation_id });

        await notifyUser({
            user_id: req.user.id,
            title: 'Nueva habilidad registrada',
            message: `Se creó la habilidad "${name}" en la operación ${operation_id}`
        });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'create',
            module: 'skills',
            description: `Habilidad "${name}" registrada (ID ${newSkill.id})`,
            ip: req.ip
        });

        // Recuperamos la habilidad recién creada con relaciones incluidas
        const skillWithRelations = await Skill.findByPk(newSkill.id, {
            include: {
                model: Operation,
                attributes: ['id', 'name', 'is_critical'],
                include: {
                    model: require('../models/mysql/area.model'),
                    attributes: ['id', 'name']
                }
            }
        });

        res.status(201).json({
            message: 'Habilidad registrada',
            skill: skillWithRelations
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al crear habilidad' });
    }
};
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updated = await Skill.update(data, { where: { id } });

        if (updated[0] === 0)
            return res.status(404).json({ message: 'Habilidad no encontrada' });

        await notifyUser({
            user_id: req.user.id,
            title: 'Habilidad actualizada',
            message: `Actualizaste la habilidad ID ${id}`
        });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'update',
            module: 'skills',
            description: `Habilidad ID ${id} actualizada`,
            ip: req.ip
        });

        // Obtener la habilidad con las relaciones (operation y area)
        const skillWithRelations = await Skill.findByPk(id, {
            include: {
                model: Operation,
                attributes: ['id', 'name', 'is_critical'],
                include: {
                    model: require('../models/mysql/area.model'),
                    attributes: ['id', 'name']
                }
            }
        });

        res.json({
            message: 'Habilidad actualizada',
            skill: skillWithRelations
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al actualizar habilidad' });
    }
};
const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Skill.destroy({ where: { id } });

        if (!deleted) return res.status(404).json({ message: 'Habilidad no encontrada' });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'delete',
            module: 'skills',
            description: `Habilidad ID ${id} eliminada`,
            ip: req.ip
        });

        res.json({ message: 'Habilidad eliminada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al eliminar habilidad' });
    }
};

// 📌 Restaurar (undo soft delete)
const restore = async (req, res) => {
    try {
        const { id } = req.params;
        const skill = await Skill.findByPk(id, { paranoid: false });
        if (!skill) return res.status(404).json({ message: 'Habilidad no encontrada' });

        await skill.restore();

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'restore',
            module: 'skills',
            description: `Habilidad ID ${id} restaurada`,
            ip: req.ip
        });

        res.json({ message: 'Habilidad restaurada', success: true, skill });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al restaurar habilidad' });
    }
};
// 📌 DataTable serverSide
const getAllDatatable = async (req, res) => {
    try {
        const draw = parseInt(req.query.draw) || 1;
        const start = parseInt(req.query.start) || 0;
        const length = parseInt(req.query.length) || 10;
        const searchValue = (req.query.search?.value || '').trim();

        // Ordenamiento
        const orderColIndex = req.query['order[0][column]'] || 0;
        let orderColName = req.query[`columns[${orderColIndex}][data]`] || 'name';
        const orderDir = (req.query['order[0][dir]'] || 'asc').toUpperCase();

        // 🚨 IMPORTANTE: usar "Operation" y "Operation.Area" en mayúscula
        if (orderColName === 'operation_name') orderColName = Sequelize.col('Operation.name');
        if (orderColName === 'area_name') orderColName = Sequelize.col('Operation.Area.name');

        // Filtro por activas/inactivas
        const where = {};
        if (req.query.is_active !== undefined) {
            const active = req.query.is_active === 'true';
            where.deletedAt = active ? null : { [Op.not]: null };
        }

        // Búsqueda
        const searchConditions = [];
        if (searchValue) {
            searchConditions.push({ name: { [Op.like]: `%${searchValue}%` } });
            searchConditions.push(
                Sequelize.where(Sequelize.col('Operation.name'), { [Op.like]: `%${searchValue}%` })
            );
            searchConditions.push(
                Sequelize.where(Sequelize.col('Operation.Area.name'), { [Op.like]: `%${searchValue}%` })
            );
        }
        if (searchConditions.length > 0) where[Op.or] = searchConditions;

        // Totales
        const recordsTotal = await Skill.count({ paranoid: false });
        const recordsFiltered = await Skill.count({
            where,
            include: [{ model: Operation, include: [Area] }],
            paranoid: false,
            distinct: true
        });

        // Consulta con relaciones
        const skills = await Skill.findAll({
            where,
            include: [
                {
                    model: Operation,
                    attributes: ['id', 'name', 'is_critical'],
                    paranoid: false,
                    include: { model: Area, attributes: ['id', 'name'], paranoid: false }
                }
            ],
            order: [[orderColName, orderDir]],
            offset: start,
            limit: length,
            paranoid: false
        });

        // Mapeo de datos
        const data = skills.map(s => ({
            id: s.id,
            name: s.name,
            operation_id: s.Operation ? s.Operation.id : null,
            operation_name: s.Operation ? s.Operation.name : null,
            is_critical: s.Operation ? s.Operation.is_critical : false,
            area_id: s.Operation?.Area ? s.Operation.Area.id : null,
            area_name: s.Operation?.Area ? s.Operation.Area.name : null,
            is_active: s.deletedAt === null
        }));

        res.json({ draw, recordsTotal, recordsFiltered, data });
    } catch (err) {
        console.error('❌ Error en getAllDatatable skills:', err);
        res.status(500).json({ message: 'Error al obtener habilidades (datatable)' });
    }
};

module.exports = {
    getAll,
    getAllDatatable,
    getOne,
    create,
    update,
    delete: remove,
    restore
};
