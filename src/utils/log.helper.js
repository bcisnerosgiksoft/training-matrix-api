// src/utils/log.helper.js
const SystemLog = require('../models/mongo/systemLog.model');

const createLog = async ({ user_id, user_name, action, module, description, ip }) => {
    try {
        console.log('📝 Registrando log:', { user_id, user_name, action, module, description, ip });

        await SystemLog.create({
            user_id,
            user_name, // 👈 se guarda en Mongo
            action,
            module,
            description,
            ip
        });

        console.log('✅ Log guardado en Mongo');
    } catch (err) {
        console.error('❌ Error al registrar log:', err);
    }
};

module.exports = { createLog };
