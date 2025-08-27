// seeds/seedUsers.js
const bcrypt = require('bcryptjs');
const User = require('../models/mysql/user.model');
const Role = require('../models/mysql/role.model');

const seedUsers = async () => {
    try {
        // ⚙️ Puedes ajustar estos valores por ENV si quieres
        const DEFAULT_ADMIN_USERNAME = process.env.SEED_ADMIN_USER || 'admin';
        const DEFAULT_ADMIN_CODE = process.env.SEED_ADMIN_CODE || 'U-0001';
        const DEFAULT_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

        // 1) Asegurar que exista el rol Administrador
        const adminRole = await Role.findOne({ where: { name: 'Administrador' } });
        if (!adminRole) {
            console.warn('⚠️ Rol "Administrador" no existe. Ejecuta primero seedRoles.');
            return;
        }

        // 2) Evitar duplicados por username o user_code
        const exists = await User.findOne({ where: { username: DEFAULT_ADMIN_USERNAME } });
        if (exists) {
            console.log(`ℹ️ Usuario "${DEFAULT_ADMIN_USERNAME}" ya existe (id ${exists.id}). Omitiendo.`);
            return;
        }

        const existsCode = await User.findOne({ where: { user_code: DEFAULT_ADMIN_CODE } });
        if (existsCode) {
            console.log(`ℹ️ user_code "${DEFAULT_ADMIN_CODE}" ya está en uso. Omitiendo.`);
            return;
        }

        // 3) Crear usuario admin con contraseña hasheada
        const hash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

        await User.create({
            user_code: DEFAULT_ADMIN_CODE,
            first_name: 'Admin',
            last_name: 'System',
            middle_name: null,      // opcional
            username: DEFAULT_ADMIN_USERNAME,
            password: hash,
            role_id: adminRole.id,
        });

        console.log('✅ Usuario admin creado con rol "Administrador".');
        console.log(`   • username: ${DEFAULT_ADMIN_USERNAME}`);
        console.log(`   • password: (usa SEED_ADMIN_PASSWORD para cambiarla)`);
    } catch (err) {
        console.error('❌ Error al seedear usuarios:', err);
    }
};

module.exports = seedUsers;
