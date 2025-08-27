// scripts/migrate-skill-documents.js
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const sequelize = require('../src/config/mysql');
const connectMongo = require('../src/config/mongo');
const mongoose = require('mongoose');

// Modelos
const Employee = require('../src/models/mysql/employee.model');
const EmployeeSkill = require('../src/models/mysql/employeeSkill.model');
const EmployeeSkillDocument = require('../src/models/mongo/employeeSkillDocument.model');

// 📂 Rutas base
const oldBase = 'D:\\WATTS\\uploadsv1';
const newBase = 'E:\\Proyectos\\api-master\\uploads';

(async () => {
    try {
        // 🔗 Conexiones
        await sequelize.authenticate();
        await connectMongo();
        console.log('✅ Conectado a MySQL y Mongo');

        // Traer todos los empleados (activos e inactivos)
        const employees = await Employee.findAll({ paranoid: false });
        console.log(`🔎 Total empleados encontrados: ${employees.length}`);

        for (const emp of employees) {
            const oldAttachmentsDir = path.join(oldBase, emp.employee_code.toString(), 'attachments');
            if (!fs.existsSync(oldAttachmentsDir)) {
                //console.log(`⚠️ No existe carpeta attachments para emp_code=${emp.employee_code}`);
                continue;
            }

            // 📂 Recorremos carpetas de employee_skill_id dentro de attachments
            const skillDirs = fs.readdirSync(oldAttachmentsDir)
                .filter(f => fs.statSync(path.join(oldAttachmentsDir, f)).isDirectory());

            for (const skillId of skillDirs) {
                const skill = await EmployeeSkill.findByPk(skillId, { paranoid: false });
                if (!skill) {
                    console.log(`⚠️ skill_id=${skillId} no existe en DB, se omite`);
                    continue;
                }

                const oldSkillDir = path.join(oldAttachmentsDir, skillId);
                const files = fs.readdirSync(oldSkillDir)
                    .filter(f => fs.statSync(path.join(oldSkillDir, f)).isFile());

                for (const file of files) {
                    // 📍 Crear carpeta destino
                    const destDir = path.join(newBase, 'employees', emp.id.toString(), 'skills', skillId.toString());
                    fs.mkdirSync(destDir, { recursive: true });

                    const destPath = path.join(destDir, file);
                    fs.copyFileSync(path.join(oldSkillDir, file), destPath);

                    // 🔎 Verificar si ya existe en Mongo
                    const exists = await EmployeeSkillDocument.findOne({
                        employee_skill_id: Number(skillId),
                        filename: file
                    });

                    if (exists) {
                        console.log(`⚠️ Ya existe en Mongo → emp=${emp.id}, skill=${skillId}, file=${file}`);
                        continue;
                    }

                    // 📑 Registrar en Mongo
                    await EmployeeSkillDocument.create({
                        employee_skill_id: Number(skillId),
                        employee_id: emp.id,
                        skill_id: skill.skill_id,
                        level: skill.level,
                        uploaded_by: 0,
                        original_filename: file,
                        filename: file,
                        path: `/uploads/employees/${emp.id}/skills/${skillId}/${file}`
                    });

                    console.log(`✅ Copiado y registrado → emp=${emp.id}, skill=${skillId}, file=${file}`);
                }

            }
        }

        console.log('🎉 Migración de evidencias terminada');
    } catch (err) {
        console.error('❌ Error en migración:', err);
    } finally {
        await sequelize.close();
        await mongoose.disconnect();
    }
})();
