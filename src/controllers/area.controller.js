// src/controllers/area.controller.js
const Area = require('../models/mysql/area.model');
const Employee = require('../models/mysql/employee.model');
const { createLog } = require('../utils/log.helper');
const { notifyUser } = require('../utils/notify.helper');
const { Op, Sequelize} = require('sequelize');

const EmployeeSkill = require('../models/mysql/employeeSkill.model');
const Skill = require('../models/mysql/skill.model');
const Operation = require('../models/mysql/operation.model');

const getAll = async (req, res) => {
    try {
        const q = req.query.q || '';

        // Traemos todas, incluidas inactivas (soft deleted)
        const areas = await Area.findAll({
            where: q ? { name: { [Op.like]: `%${q}%` } } : undefined,
            include: [{ model: Employee, as: 'supervisor' }],
            order: [['name', 'ASC']],
            paranoid: false // 👈 importante para incluir eliminadas
        });

        const results = await Promise.all(areas.map(async (area) => {
            // Empleados del área (solo activos, porque Employee no tiene paranoid en tu modelo)
            const employees = await Employee.findAll({ where: { area_id: area.id } });
            const employeeCount = employees.length;

            // Operaciones del área
            const operations = await Operation.findAll({
                where: { area_id: area.id },
                include: [Skill]
            });

            // Skills de todas las operaciones
            const allSkillIds = operations.flatMap(op => op.Skills.map(s => s.id));

            // Skills de operaciones críticas
            const criticalSkillIds = operations
                .filter(op => op.is_critical)
                .flatMap(op => op.Skills.map(s => s.id));

            // EmployeeSkills para todas las habilidades
            const employeeSkills = await EmployeeSkill.findAll({
                where: {
                    skill_id: allSkillIds.length > 0 ? allSkillIds : [0]
                },
                include: [Skill]
            });

            // Promedio general
            const total = employeeSkills.reduce((acc, s) => acc + (s.level ?? 0), 0);
            const avg =
                employeeSkills.length > 0
                    ? parseFloat((total / employeeSkills.length).toFixed(2))
                    : null;

            // EmployeeSkills en operaciones críticas
            const criticalEmployeeSkills = employeeSkills.filter(es =>
                criticalSkillIds.includes(es.skill_id)
            );

            // Indicadores 1 a 3
            const empleados_sin_entrenar = criticalEmployeeSkills.filter(es => es.level === 0).length;
            const empleados_en_formacion = criticalEmployeeSkills.filter(es => es.level === 1).length;
            const empleados_certificados = criticalEmployeeSkills.filter(es => es.level >= 2).length;

            // Indicador 4: Top 3 habilidades más débiles
            const skillWeaknessMap = {};
            for (const es of criticalEmployeeSkills) {
                if (es.level < 2) { // menor a certificación
                    const skillName = es.Skill.name;
                    skillWeaknessMap[skillName] = (skillWeaknessMap[skillName] || 0) + 1;
                }
            }
            const habilidades_mas_debiles = Object.entries(skillWeaknessMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([skill, pendientes]) => ({ skill, pendientes }));

            return {
                id: area.id,
                name: area.name,
                supervisor: area.supervisor,
                employee_count: employeeCount,
                avg_skill_level: avg,
                empleados_sin_entrenar,
                empleados_en_formacion,
                empleados_certificados,
                habilidades_mas_debiles,
                is_active: area.deletedAt === null // 👈 marca activa/inactiva
            };
        }));

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener las áreas' });
    }
};

const getOne = async (req, res) => {
    try {
        const { id } = req.params;
        const area = await Area.findByPk(id, { include: [{ model: Employee, as: 'supervisor' }] });
        if (!area) return res.status(404).json({ message: 'Área no encontrada' });
        res.json(area);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener el área' });
    }
};

const create = async (req, res) => {
    try {
        const { name, supervisor_id } = req.body;

        const area = await Area.create({ name, supervisor_id });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'create',
            module: 'areas',
            description: `Área ${name} creada (ID ${area.id})`,
            ip: req.ip
        });

        await notifyUser({
            user_id: 1,
            title: 'Nueva área creada',
            message: `Se ha creado el área ${name} con ID ${area.id}`
        });

        res.status(201).json({ message: 'Área creada', area });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'El nombre del área ya existe' });
        }
        console.error(err);
        res.status(500).json({ message: 'Error al crear área' });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, supervisor_id } = req.body;

        const area = await Area.findByPk(id);
        if (!area) return res.status(404).json({ message: 'Área no encontrada' });

        await area.update({ name, supervisor_id });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'update',
            module: 'areas',
            description: `Área ${name} actualizada (ID ${area.id})`,
            ip: req.ip
        });

        res.json({ message: 'Área actualizada', area });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'El nombre del área ya existe' });
        }
        console.error(err);
        res.status(500).json({ message: 'Error al actualizar área' });
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const area = await Area.findByPk(id);
        if (!area) return res.status(404).json({ message: 'Área no encontrada' });

        await area.destroy();

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'delete',
            module: 'areas',
            description: `Área con ID ${id} eliminada`,
            ip: req.ip
        });

        res.json({ message: 'Área eliminada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al eliminar área' });
    }
};

const restore = async (req, res) => {
    try {
        const { id } = req.params;
        const area = await Area.findByPk(id, { paranoid: false }); // 👈 importante incluir inactivas
        if (!area) return res.status(404).json({ message: 'Área no encontrada' });

        await area.restore();

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'restore',
            module: 'areas',
            description: `Área con ID ${id} restaurada`,
            ip: req.ip
        });

        res.json({ message: 'Área restaurada', area });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al restaurar área' });
    }
};

// 📌 Función para DataTables (serverSide)
const getAllDatatable = async (req, res) => {
    try {
        const draw = parseInt(req.query.draw) || 1;
        const start = parseInt(req.query.start) || 0;
        const length = parseInt(req.query.length) || 10;
        const searchValue = (req.query.search?.value || '').trim();

        // Ordenamiento
        const orderColIndex = req.query['order[0][column]'] || 0;
        const orderColName = req.query[`columns[${orderColIndex}][data]`] || 'name';
        const orderDir = req.query['order[0][dir]'] || 'asc';

        // include supervisor
        const includeSupervisor = {
            model: Employee,
            as: 'supervisor',
            required: false // 🔑 si no, excluye áreas sin supervisor
        };

        // Condiciones de búsqueda
        const where = {};
        if (req.query.is_active !== undefined) {
            const active = req.query.is_active === 'true';
            where.deletedAt = active ? null : { [Op.not]: null };
        }

        const searchConditions = [];
        if (searchValue) {
            searchConditions.push(
                { name: { [Op.like]: `%${searchValue}%` } }
            );
            searchConditions.push(
                Sequelize.where(
                    Sequelize.col('supervisor.full_name'),
                    { [Op.like]: `%${searchValue}%` }
                )
            );
        }
        if (searchConditions.length > 0) {
            where[Op.or] = searchConditions;
        }

        // Totales
        const recordsTotal = await Area.count({ paranoid: false });

        const recordsFiltered = await Area.count({
            where,
            include: [includeSupervisor],
            paranoid: false,
            distinct: true // 🔑 necesario cuando usas include
        });

        // Registros con paginación
        const areas = await Area.findAll({
            where,
            include: [includeSupervisor],
            order: [[orderColName, orderDir.toUpperCase()]],
            offset: start,
            limit: length,
            paranoid: false
        });

        const data = areas.map(area => ({
            id: area.id,
            name: area.name,
            supervisor: area.supervisor ? area.supervisor.full_name : null,
            supervisor_id: area.supervisor ? area.supervisor.id : null,
            is_active: area.deletedAt === null
        }));

        res.json({
            draw,
            recordsTotal,
            recordsFiltered,
            data
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener áreas (datatable)' });
    }
};

module.exports = {
    getAll,
    getAllDatatable, // 👈 aquí exportamos la nueva
    getOne,
    create,
    update,
    delete: remove,
    restore
};


