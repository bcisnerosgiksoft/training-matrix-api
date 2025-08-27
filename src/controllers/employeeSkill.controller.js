// src/controllers/employeeSkill.controller.js
const EmployeeSkill = require('../models/mysql/employeeSkill.model');
const Skill = require('../models/mysql/skill.model');
const Operation = require('../models/mysql/operation.model');
const EmployeeSkillDocument = require('../models/mongo/employeeSkillDocument.model');
const Employee = require('../models/mysql/employee.model');
const Class = require('../models/mysql/class.model');
const Shift = require('../models/mysql/shift.model');

const { createLog } = require('../utils/log.helper');
const { notifyUser } = require('../utils/notify.helper');
const path = require('path');

// Asignar o actualizar nivel de habilidad
const assignOrUpdateSkill = async (req, res) => {
    try {
        const { employee_id, skill_id, level } = req.body;

        if (![0, 1, 2, 3, 4].includes(Number(level))) {
            return res.status(400).json({ message: 'Nivel de habilidad no permitido (debe estar entre 0 y 4)' });
        }

        const existing = await EmployeeSkill.findOne({ where: { employee_id, skill_id } });

        if (existing) {
            // Validar cambio secuencial
            const diff = Math.abs(level - existing.level);
            if (diff !== 1) {
                return res.status(400).json({
                    message: `No se permite cambiar del nivel ${existing.level} al ${level} directamente. Debe ser secuencial.`
                });
            }

            existing.level = level;
            existing.updated_by = req.user.id;
            existing.updated_at = new Date();
            await existing.save();
        } else {
            await EmployeeSkill.create({
                employee_id,
                skill_id,
                level,
                updated_by: req.user.id
            });
        }

        // Guardar documentos en Mongo
        const docs = [];
        for (const file of req.files || []) {
            const doc = await EmployeeSkillDocument.create({
                employee_id,
                skill_id,
                level,
                uploaded_by: req.user.id,
                filename: file.filename,
                original_filename: file.originalname,
                path: path.join(`/uploads/skills/${employee_id}/${file.filename}`),
                uploaded_at: new Date()
            });
            docs.push(doc);
        }

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'update_level',
            module: 'employee_skills',
            description: `Actualizado nivel de habilidad (${skill_id}) para empleado (${employee_id}) a nivel ${level}`,
            ip: req.ip
        });

        await notifyUser({
            user_id: req.user.id,
            title: 'Nivel de habilidad actualizado',
            message: `Actualizaste el nivel de una habilidad para el empleado ID ${employee_id}`
        });

        res.json({ message: 'Nivel actualizado correctamente', documents: docs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al asignar o actualizar habilidad' });
    }
};

// Obtener habilidades por empleado
const getEmployeeSkills = async (req, res) => {
    try {
        const { employee_id } = req.params;

        const skills = await EmployeeSkill.findAll({
            where: { employee_id },
            include: {
                model: Skill,
                include: {
                    model: Operation
                }
            }
        });

        res.json(skills);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener habilidades del empleado' });
    }
};
const getEmployeeSkillsPublic = async (req, res) => {
    try {
        const { code } = req.params;

        const employee = await Employee.findOne({ where: { employee_code: code } });

        if (!employee) {
            return res.status(404).json({ message: 'Empleado no encontrado' });
        }

        const skills = await EmployeeSkill.findAll({
            where: { employee_id: employee.id },
            include: {
                model: Skill,
                include: {
                    model: Operation
                }
            }
        });

        res.json(skills);
    } catch (error) {
        console.error('❌ Error al obtener habilidades públicas:', error);
        res.status(500).json({ message: 'Error al obtener habilidades del empleado' });
    }
};
const getSkillsByArea = async (req, res) => {
    try {
        const { area_id } = req.params;
        const { class_id, shift_id } = req.query; // 👈 filtros opcionales

        // condiciones dinámicas de búsqueda
        const where = { area_id };
        if (shift_id) where.shift_id = shift_id; // filtrar por turno desde SQL

        const employees = await Employee.findAll({
            where,
            include: [
                {
                    model: Class,
                    attributes: ['id', 'name', 'deletedAt'],
                    paranoid: false
                },
                {
                    model: Shift,
                    attributes: ['id', 'name', 'start_time', 'end_time', 'deletedAt'],
                    paranoid: false
                }
            ]
        });

        // si hay class_id, filtramos empleados en memoria
        const filteredEmployees = class_id
            ? employees.filter(emp => emp.Class && emp.Class.id == class_id)
            : employees;

        const allSkills = [];

        for (const emp of filteredEmployees) {
            const skills = await EmployeeSkill.findAll({
                where: { employee_id: emp.id },
                include: {
                    model: Skill,
                    required: true,
                    include: {
                        model: Operation,
                        where: { area_id },
                        required: true
                    }
                }
            });

            const enriched = skills.map(s => ({
                ...s.toJSON(),
                employee: {
                    id: emp.id,
                    name: emp.full_name,
                    code: emp.employee_code,
                    class: emp.Class
                        ? { id: emp.Class.id, name: emp.Class.name }
                        : null,
                    shift: emp.Shift
                        ? {
                            id: emp.Shift.id,
                            name: emp.Shift.name,
                            start_time: emp.Shift.start_time,
                            end_time: emp.Shift.end_time
                        }
                        : null
                }
            }));

            allSkills.push(...enriched);
        }

        res.json(allSkills);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener habilidades por área' });
    }
};

// Eliminar una asignación de habilidad
const deleteEmployeeSkill = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await EmployeeSkill.findByPk(id);

        if (!record) return res.status(404).json({ message: 'Asignación de habilidad no encontrada' });

        await EmployeeSkill.destroy({ where: { id } });

        await createLog({
            user_id: req.user.id,
            user_name: req.user.username,
            action: 'delete',
            module: 'employee_skills',
            description: `Eliminada habilidad (${record.skill_id}) del empleado (${record.employee_id})`,
            ip: req.ip
        });

        res.json({ message: 'Asignación eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar habilidad' });
    }
};

module.exports = {
    assignOrUpdateSkill,
    getEmployeeSkills,
    deleteEmployeeSkill,
    getEmployeeSkillsPublic,
    getSkillsByArea
};
