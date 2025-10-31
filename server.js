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

// ===== Carga de modelos (solo para inicializar y registrar asociaciones internas) =====
safeRequire('./src/models/mysql/role.model');
safeRequire('./src/models/mysql/user.model');
safeRequire('./src/models/mysql/position.model');
safeRequire('./src/models/mysql/shift.model');
safeRequire('./src/models/mysql/area.model');
safeRequire('./src/models/mysql/employee.model');
safeRequire('./src/models/mysql/operation.model');
safeRequire('./src/models/mysql/skill.model');
safeRequire('./src/models/mysql/employeeSkill.model');

// ===== Configuración de entorno =====
const IS_DEV = (process.env.NODE_ENV || '').toLowerCase() === 'development';
const PORT = Number(process.env.PORT) || 3000;
const REQUIRE_MONGO = (process.env.REQUIRE_MONGO ?? 'false').toLowerCase() === 'true';

// Flags .env
const RUN_SEEDS = (process.env.RUN_SEEDS ?? 'false').toLowerCase() === 'true';
const SEQUELIZE_SYNC = (process.env.SEQUELIZE_SYNC ?? 'none').toLowerCase(); // none | alter | force
const DEV_RESET = (process.env.DEV_RESET ?? 'true').toLowerCase() === 'true';

// Overrides efectivos
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

// ===== Rutas básicas de monitoreo =====
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

// ===== Arranque principal =====
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
        process.exit(1);
    }

    try {
        logPhase('Conectando a MongoDB');
        if (typeof connectMongo === 'function') {
            await connectMongo();
            console.log('🟢 MongoDB conectado');

            if (EFFECTIVE_SYNC === 'force') {
                console.warn('⚠️  Limpieza de MongoDB (force)');
                try {
                    const collections = [
                        'blacklistedtokens',
                        'employeedocuments',
                        'employeeskilldocuments',
                        'notifications',
                        'systemlogs'
                    ];
                    for (const col of collections) {
                        await mongoose.connection.db.collection(col).deleteMany({});
                    }
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
        await sequelize.close().then(() => console.log('🔒 MySQL cerrado')).catch(console.warn);
        if (mongoose.connection?.readyState === 1) {
            await mongoose.connection.close();
            console.log('🔒 MongoDB cerrado');
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
    shutdown('uncaughtException');
});

// ===== Go! =====
start();
