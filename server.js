'use strict';
require('dotenv').config();
process.title = process.env.PROCESS_TITLE || 'bwise-api';

const http = require('http');
const app = require('./src/app');

// ===== Utils to safely require optional modules =====
function safeRequire(path, { silent = false } = {}) {
    try {
        return require(path);
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            if (!silent) console.warn(`⚠️  Módulo opcional no encontrado: ${path}`);
            return null;
        }
        throw err;
    }
}
function requireFirst(paths) {
    for (const p of paths) {
        const mod = safeRequire(p, { silent: true });
        if (mod) return mod;
    }
    return null;
}

// ===== DB Connectors =====
const sequelize = require('./src/config/mysql');
const mongoose = safeRequire('mongoose') || {};
const connectMongo = safeRequire('./src/config/mongo');

// ===== Models (carga p/ asociaciones) =====
const Role = safeRequire('./src/models/mysql/role.model');
const User = safeRequire('./src/models/mysql/user.model');
const Position = safeRequire('./src/models/mysql/position.model');
const Shift = safeRequire('./src/models/mysql/shift.model');
const Area = safeRequire('./src/models/mysql/area.model');
const Employee = safeRequire('./src/models/mysql/employee.model');
const Skill = safeRequire('./src/models/mysql/skill.model');
const Operation = safeRequire('./src/models/mysql/operation.model');

// ===== Asociaciones (ajusta según tus FKs reales) =====
function applyAssociations() {
    if (User && Role) User.belongsTo(Role, { foreignKey: 'role_id' });

    if (Area && Employee) {
        Area.belongsTo(Employee, { foreignKey: 'supervisor_id', as: 'supervisor' });
        Area.hasMany(Employee, { foreignKey: 'area_id' });
    }
    if (Employee && Area) Employee.belongsTo(Area, { foreignKey: 'area_id' });

    if (Operation && Skill) Operation.hasMany(Skill, { foreignKey: 'operation_id' });
    if (Skill && Operation) Skill.belongsTo(Operation, { foreignKey: 'operation_id' });

    if (Operation && Area) Operation.belongsTo(Area, { foreignKey: 'area_id', as: 'area' });

    // Descomenta si existen estas FKs en tu esquema
    if (Employee && Position) {
        // Employee.belongsTo(Position, { foreignKey: 'position_id' });
    }
    if (Employee && Shift) {
        // Employee.belongsTo(Shift, { foreignKey: 'shift_id' });
    }
}
applyAssociations();

// ===== Config =====
const IS_DEV = (process.env.NODE_ENV || '').toLowerCase() === 'development';
const PORT = Number(process.env.PORT) || 3000;
const REQUIRE_MONGO = (process.env.REQUIRE_MONGO ?? 'false').toLowerCase() === 'true';

// Flags .env
const RUN_SEEDS = (process.env.RUN_SEEDS ?? 'false').toLowerCase() === 'true';
const SEQUELIZE_SYNC = (process.env.SEQUELIZE_SYNC ?? 'none').toLowerCase(); // none | alter | force
const DEV_RESET = (process.env.DEV_RESET ?? 'true').toLowerCase() === 'true';

// Overrides efectivos (siempre reiniciar todo en dev, a menos que desactives con DEV_RESET=false)
const EFFECTIVE_SYNC = IS_DEV && DEV_RESET ? 'force' : SEQUELIZE_SYNC;
const EFFECTIVE_RUN_SEEDS = IS_DEV && DEV_RESET ? true : RUN_SEEDS;

// Versión de app (opcional)
let PKG = { name: 'bwise-api', version: '0.0.0' };
try { PKG = require('./package.json'); } catch { /* noop */ }

// ===== Helpers =====
function logPhase(label) {
    console.log(`\n—— ${label} ——`);
}

async function syncSchema() {
    switch (EFFECTIVE_SYNC) {
        case 'force':
            console.warn('⚠️  sequelize.sync({ force: true }) — reseteando tablas (DEV).');
            await sequelize.sync({ force: true });
            break;
        case 'alter':
            console.warn('⚠️  sequelize.sync({ alter: true }) — evita en producción.');
            await sequelize.sync({ alter: true });
            break;
        default:
            await sequelize.sync();
            break;
    }
    console.log(`✅ Tablas sincronizadas`);
}

async function runSeedsIfNeeded() {
    if (!EFFECTIVE_RUN_SEEDS) {
        console.log('ℹ️ Seeds omitidos (EFFECTIVE_RUN_SEEDS=false).');
        return;
    }
    logPhase('Ejecutando seeds');

    // Busca seeds en rutas comunes (ajusta si tus archivos están en otro sitio)
    const seedPositions = requireFirst([
        './src/utils/seedPositions',
        './src/seeds/seedPositions',
        './seeds/seedPositions',
    ]);
    const seedRoles = requireFirst([
        './src/utils/seedRoles',
        './src/seeds/seedRoles',
        './seeds/seedRoles',
    ]);
    const seedShifts = requireFirst([
        './src/utils/seedShifts',
        './src/seeds/seedShifts',
        './seeds/seedShifts',
    ]);
    const seedClasses = requireFirst([
        './src/utils/seedClasses',
        './src/seeds/seedClasses',
        './seeds/seedClasses',
    ]);
    const seedAreas = requireFirst([
        './src/utils/seedAreas',
        './src/seeds/seedAreas',
        './seeds/seedAreas',
    ]);
    const seedUsers = requireFirst([
        './src/utils/seedUsers',
        './src/seeds/seedUsers',
        './seeds/seedUsers',
    ]);
    const seedOperations = requireFirst([
        './src/utils/seedOperations',
        './src/seeds/seedOperations',
        './seeds/seedOperations',
    ]);
    const seedSkills = requireFirst([
        './src/utils/seedSkills',
        './src/seeds/seedSkills',
        './seeds/seedSkills',
    ]);

    // Orden sugerido (por dependencias)
    if (seedPositions) await seedPositions();
    if (seedRoles) await seedRoles();
    if (seedShifts) await seedShifts();
    if (seedClasses) await seedClasses();
    if (seedAreas) await seedAreas();
    if (seedUsers) await seedUsers();
    if (seedOperations) await seedOperations();
    if (seedSkills) await seedSkills();

    console.log('✅ Seeds ejecutados');
}

// ===== Health & Version =====
app.get('/health', async (_req, res) => {
    const health = {
        status: 'ok',
        name: PKG.name,
        version: PKG.version,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        mysql: 'unknown',
        mongo: 'unknown'
    };
    try {
        await sequelize.authenticate();
        health.mysql = 'up';
    } catch {
        health.mysql = 'down';
    }
    try {
        health.mongo = (mongoose.connection?.readyState === 1) ? 'up' : 'down';
    } catch {
        health.mongo = 'unknown';
    }
    const code = health.mysql === 'up' ? 200 : 503;
    res.status(code).json(health);
});

app.get('/version', (_req, res) => {
    res.json({ name: PKG.name, version: PKG.version, node: process.version });
});

// ===== Arranque =====
let server;

async function start() {
    console.log('\n🚀 Iniciando', {
        NODE_ENV: process.env.NODE_ENV,
        PORT,
        DEV_RESET,
        SEQUELIZE_SYNC,
        RUN_SEEDS,
        EFFECTIVE_SYNC,
        EFFECTIVE_RUN_SEEDS,
        REQUIRE_MONGO
    });

    try {
        logPhase('Conectando a MySQL');
        await sequelize.authenticate();
        console.log('🟢 MySQL conectado');

        logPhase('Sincronizando esquema');
        await syncSchema();

        await runSeedsIfNeeded();
    } catch (err) {
        console.error('🔴 Error en MySQL (conexión/sync/seeds):', err?.message || err);
        process.exit(1); // MySQL es crítico → abortar
    }

    try {
        logPhase('Conectando a MongoDB');
        if (typeof connectMongo === 'function') {
            await connectMongo();
            console.log('🟢 MongoDB conectado');

            // 👉 Si estás en force, vacía colecciones
            if (EFFECTIVE_SYNC === 'force') {
                console.warn('⚠️  Limpieza de MongoDB (force)');
                const mongoose = require('mongoose');
                try {
                    await mongoose.connection.db.collection('blacklistedtokens').deleteMany({});
                    await mongoose.connection.db.collection('employeedocuments').deleteMany({});
                    await mongoose.connection.db.collection('employeeskilldocuments').deleteMany({});
                    await mongoose.connection.db.collection('notifications').deleteMany({});
                    await mongoose.connection.db.collection('systemlogs').deleteMany({});
                    console.log('🗑️  Colecciones vaciadas correctamente');
                } catch (err) {
                    console.error('🔴 Error vaciando colecciones:', err);
                }
            }
        } else {
            console.warn('⚠️  Conector de MongoDB no encontrado. Saltando conexión.');
        }
    } catch (err) {
        console.error('🔴 Error conectando a MongoDB:', err?.message || err);
        if (REQUIRE_MONGO) process.exit(1);
        console.warn('⚠️  REQUIRE_MONGO=false → continuamos sin MongoDB.');
    }

    logPhase('Levantando servidor HTTP');
    server = http.createServer(app);
    server.listen(PORT, () => {
        console.log(`✅ ${PKG.name}@${PKG.version} escuchando en http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
        console.error('🔴 Error del servidor HTTP:', err);
        process.exit(1);
    });
}

// ===== Apagado elegante =====
async function shutdown(signal = 'SIGTERM') {
    console.log(`\n🛑 Señal ${signal} recibida. Cerrando…`);
    try {
        if (server) {
            await new Promise((resolve) => server.close(resolve));
            console.log('🔒 HTTP cerrado');
        }
        try {
            await sequelize.close();
            console.log('🔒 MySQL cerrado');
        } catch (e) {
            console.warn('⚠️  Error cerrando MySQL:', e?.message || e);
        }
        try {
            if (mongoose.connection?.readyState === 1) {
                await mongoose.connection.close();
                console.log('🔒 MongoDB cerrado');
            }
        } catch (e) {
            console.warn('⚠️  Error cerrando MongoDB:', e?.message || e);
        }
        process.exit(0);
    } catch (err) {
        console.error('🔴 Error durante apagado:', err);
        process.exit(1);
    }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
    console.error('🔴 Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('🔴 Uncaught Exception:', err);
    // En servidores críticos podrías querer reiniciar el proceso
    shutdown('uncaughtException');
});

// ===== Go! =====
start();
