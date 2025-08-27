// src/controllers/operation.controller.js
const Operation = require('../models/mysql/operation.model');
const Area = require('../models/mysql/area.model');
const { createLog } = require('../utils/log.helper');
const { Op, Sequelize } = require('sequelize');

const getAll = async (req, res) => {
    try {
        const operations = await Operation.findAll({
            include: {
                model: Area,
                as: 'area',
                attributes: ['name'] // solo trae el nombre
            },
            order: [
                [{ model: Area, as: 'area' }, 'name', 'ASC'], // Ordenar por área
                ['name', 'ASC'] // Luego por nombre de operación
            ]
        });

        // Convertir a JSON plano con area_name en la raíz
        const result = operations.map(op => {
            const plain = op.toJSON();
            return {
                ...plain,
                area_name: plain.area?.name || null,
            };
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener operaciones' });
    }
};

const getOne = async (req, res) => {
    const operation = await Operation.findByPk(req.params.id);
    if (!operation) return res.status(404).json({ message: 'Operación no encontrada' });
    res.json(operation);
};

const create = async (req, res) => {
    try {
        const { name, area_id, is_critical } = req.body;

        const operation = await Operation.create({ name, area_id, is_critical });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'create',
            module: 'operations',
            description: `Operación creada: ${name}`,
            ip: req.ip
        });

        res.status(201).json({ message: 'Operación creada', operation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear operación' });
    }
};

const update = async (req, res) => {
    try {
        const { name, area_id, is_critical } = req.body;
        const operation = await Operation.findByPk(req.params.id);
        if (!operation) return res.status(404).json({ message: 'Operación no encontrada' });

        await operation.update({ name, area_id, is_critical });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'update',
            module: 'operations',
            description: `Operación actualizada: ${name}`,
            ip: req.ip
        });

        res.json({ message: 'Operación actualizada', operation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar operación' });
    }
};

const remove = async (req, res) => {
    try {
        const deleted = await Operation.destroy({ where: { id: req.params.id } });
        if (!deleted) return res.status(404).json({ message: 'Operación no encontrada' });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'delete',
            module: 'operations',
            description: `Operación eliminada (ID: ${req.params.id})`,
            ip: req.ip
        });

        res.json({ message: 'Operación eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar operación' });
    }
};

const getByArea = async (req, res) => {
    const { area_id } = req.params;

    try {
        const operations = await Operation.findAll({
            where: { area_id },
            order: [['name', 'ASC']]
        });

        res.json(operations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener operaciones por área' });
    }
};

const restore = async (req, res) => {
    try {
        const { id } = req.params;
        const operation = await Operation.findByPk(id, { paranoid: false }); // incluir inactivas
        if (!operation) {
            return res.status(404).json({ message: 'Operación no encontrada' });
        }

        await operation.restore();

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'restore',
            module: 'operations',
            description: `Operación restaurada (ID: ${id})`,
            ip: req.ip
        });

        res.json({ message: 'Operación restaurada', success: true, operation });
    } catch (error) {
        console.error('❌ Error al restaurar operación:', error);
        res.status(500).json({ message: 'Error al restaurar operación' });
    }
};

const getAllDatatable = async (req, res) => {
    try {
        const draw = parseInt(req.query.draw) || 1;
        const start = parseInt(req.query.start) || 0;
        const length = parseInt(req.query.length) || 10;
        const searchValue = (req.query.search?.value || '').trim();

        const orderColIndex = req.query['order[0][column]'] || 0;
        let orderColName = req.query[`columns[${orderColIndex}][data]`] || 'name';
        const orderDir = (req.query['order[0][dir]'] || 'asc').toUpperCase();

        // 👇 mapear alias "area_name"
        if (orderColName === 'area_name') {
            orderColName = Sequelize.col('area.name');
        }

        // condición activas/inactivas
        const where = {};
        if (req.query.is_active !== undefined) {
            const active = req.query.is_active === 'true';
            where.deletedAt = active ? null : { [Op.not]: null };
        }

        // include área (sin filtros aquí)
        const includeArea = {
            model: Area,
            as: 'area',
            attributes: ['id', 'name'],
            required: false
        };

        // 🔍 Búsqueda global
        const searchConditions = [];
        if (searchValue) {
            // buscar por nombre operación
            searchConditions.push({ name: { [Op.like]: `%${searchValue}%` } });

            // buscar por nombre del área
            searchConditions.push(
                Sequelize.where(Sequelize.col('area.name'), {
                    [Op.like]: `%${searchValue}%`
                })
            );

            // buscar por is_critical (sí/no)
            const lower = searchValue.toLowerCase();
            if (['si', 'sí', 'yes', '1'].includes(lower)) {
                where.is_critical = true;
            } else if (['no', '0'].includes(lower)) {
                where.is_critical = false;
            }
        }
        if (searchConditions.length > 0) {
            where[Op.or] = searchConditions;
        }

        // total sin filtro
        const recordsTotal = await Operation.count({ paranoid: false });

        // total filtrado
        const recordsFiltered = await Operation.count({
            where,
            include: [includeArea],
            paranoid: false,
            distinct: true
        });

        // query paginada
        const operations = await Operation.findAll({
            where,
            include: [includeArea],
            order: [[orderColName, orderDir]],
            offset: start,
            limit: length,
            paranoid: false
        });

        const data = operations.map(op => ({
            id: op.id,
            name: op.name,
            area_name: op.area ? op.area.name : '---',
            area_id: op.area ? op.area.id : null,
            is_critical: op.is_critical,
            is_active: op.deletedAt === null
        }));

        res.json({
            draw,
            recordsTotal,
            recordsFiltered,
            data
        });
    } catch (err) {
        console.error('❌ Error en getAllDatatable operaciones:', err);
        res.status(500).json({ message: 'Error al obtener operaciones (datatable)' });
    }
};


module.exports = {
    getAll,
    getAllDatatable,  // 👈 nuevo
    getOne,
    create,
    update,
    delete: remove,
    getByArea,
    restore
};