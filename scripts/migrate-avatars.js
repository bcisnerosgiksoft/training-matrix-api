require('dotenv').config();  // 👈 Esto antes de importar mysql.js
const fs = require('fs');
const path = require('path');
const sequelize = require('../src/config/mysql'); // 👈 Reutilizas tu config
const Employee = require('../src/models/mysql/employee.model'); // 👈 Tu modelo

const oldBase = 'D:\\WATTS\\uploadsv1';
const newBase = 'E:\\Proyectos\\api-master\\uploads';

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado a la DB');

        // Traer todos, incluyendo dados de baja
        const employees = await Employee.findAll({ paranoid: false });
        console.log(`🔎 Total empleados encontrados (incluyendo bajas): ${employees.length}`);

        for (const emp of employees) {
            console.log(`➡️ Revisando empleado id=${emp.id}, code=${emp.employee_code}, deletedAt=${emp.deletedAt}`);

            const oldDir = path.join(oldBase, emp.employee_code.toString());

            if (!fs.existsSync(oldDir)) {
                console.log(`⚠️ Carpeta no existe para employee_code=${emp.employee_code}`);
                continue;
            }

            let files = fs.readdirSync(oldDir)
                .filter(f => fs.statSync(path.join(oldDir, f)).isFile())
                .filter(f => /\.(jpg|jpeg|png|jfif)$/i.test(f)); // ahora acepta jfif

            if (files.length === 0) {
                console.log(`⚠️ No hay fotos en raiz para employee_code=${emp.employee_code}`);
                continue;
            }

            // tomar la primera foto encontrada
            const firstPhoto = files[0];

            if (!emp.photo_url) {
                console.log(`⚠️ Empleado id=${emp.id} (code=${emp.employee_code}) no tiene photo_url en DB`);
                continue; // o aquí podrías asignar un placeholder si quieres
            }

            // 📍 Ruta destino según DB
            const relPath = emp.photo_url.replace('/uploads/', '');
            const destPath = path.join(newBase, relPath);

            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            fs.copyFileSync(path.join(oldDir, firstPhoto), destPath);

            console.log(`✅ Copiado avatar de empleado ${emp.id} (${emp.employee_code}) → ${destPath}`);
        }

        console.log('🎉 Proceso terminado');
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await sequelize.close();
    }
})();
