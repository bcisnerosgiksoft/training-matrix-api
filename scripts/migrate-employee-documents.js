// scripts/migrate-employee-documents.js
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const sequelize = require('../src/config/mysql');
const connectMongo = require('../src/config/mongo');
const mongoose = require('mongoose');

// Modelos
const Employee = require('../src/models/mysql/employee.model');
const EmployeeDocument = require('../src/models/mongo/employeeDocument.model');

// 📂 Rutas base
const oldBase = 'D:\\WATTS\\uploadsv1\\general';
const newBase = 'E:\\Proyectos\\api-master\\uploads';

function generateStoredFilename(original) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(original) || '';
    return `document-${uniqueSuffix}${ext}`;
}

(async () => {
    try {
        await sequelize.authenticate();
        await connectMongo();
        console.log('✅ Conectado a MySQL y Mongo');

        // 📂 Recorremos las carpetas dentro de "general"
        const employeeDirs = fs.readdirSync(oldBase)
            .filter(f => fs.statSync(path.join(oldBase, f)).isDirectory());

        for (const empId of employeeDirs) {
            const oldDir = path.join(oldBase, empId);

            // verificar que sea un empleado válido en DB
            const emp = await Employee.findByPk(empId, { paranoid: false });
            if (!emp) {
                console.log(`⚠️ Empleado id=${empId} no existe en DB, se omite`);
                continue;
            }

            const files = fs.readdirSync(oldDir)
                .filter(f => fs.statSync(path.join(oldDir, f)).isFile());

            for (const file of files) {
                const storedFilename = generateStoredFilename(file);
                const destDir = path.join(newBase, 'employees', emp.id.toString(), 'documents');
                fs.mkdirSync(destDir, { recursive: true });

                const destPath = path.join(destDir, storedFilename);
                fs.copyFileSync(path.join(oldDir, file), destPath);

                // Registrar en Mongo
                await EmployeeDocument.create({
                    employee_id: emp.id,
                    original_filename: file,
                    stored_filename: storedFilename,
                    path: `/uploads/employees/${emp.id}/documents/${storedFilename}`,
                    type: 'otro',         // puedes ajustar si tienes clasificación
                    uploaded_by: 0        // 👈 usuario sistema/migración
                });

                console.log(`✅ Copiado y registrado → emp=${emp.id}, file=${file}`);
            }
        }

        console.log('🎉 Migración de documentos generales terminada');
    } catch (err) {
        console.error('❌ Error en migración:', err);
    } finally {
        await sequelize.close();
        await mongoose.disconnect();
    }
})();
