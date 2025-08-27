const SystemLog = require('../models/mongo/systemLog.model');

const getLogs = async (req, res) => {
    try {
        const { module, user_id, action, desde, hasta, limit = 100 } = req.query;

        const query = {};

        // Filtros dinámicos
        if (module) query.module = module;
        if (user_id) query.user_id = Number(user_id); // Asegúrate que esté como número si así lo guardaste
        if (action) query.action = action;

        if (desde || hasta) {
            query.created_at = {};

            if (desde) {
                // Si solo mandas la fecha, asumimos desde las 00:00:00
                const desdeDate = desde.length === 10 ? `${desde}T00:00:00` : desde;
                query.created_at.$gte = new Date(desdeDate);
            }

            if (hasta) {
                // Si solo mandas la fecha, asumimos hasta las 23:59:59
                const hastaDate = hasta.length === 10 ? `${hasta}T23:59:59` : hasta;
                query.created_at.$lte = new Date(hastaDate);
            }
        }

        const logs = await SystemLog.find(query)
            .sort({ created_at: -1 }) // Más recientes primero
            .limit(parseInt(limit));

        res.json(logs);
    } catch (error) {
        console.error('❌ Error al obtener logs:', error);
        res.status(500).json({ message: 'Error al obtener logs del sistema' });
    }
};
const getRecentLogs = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        const logs = await SystemLog.find({})
            .sort({ created_at: -1 })
            .limit(limit);

        res.json(logs);
    } catch (error) {
        console.error('Error al obtener actividad reciente:', error);
        res.status(500).json({ message: 'Error al obtener actividad reciente' });
    }
};

const getAllDatatable = async (req, res) => {
    try {
        const draw = parseInt(req.query.draw) || 1;
        const start = parseInt(req.query.start) || 0;
        const length = parseInt(req.query.length) || 10;
        const searchValue = (req.query.search?.value || "").trim();

        // Ordenamiento
        const orderColIndex = req.query["order[0][column]"] || 0;
        const orderColName = req.query[`columns[${orderColIndex}][data]`] || "created_at";
        const orderDir = (req.query["order[0][dir]"] || "desc").toLowerCase();
        const sort = { [orderColName]: orderDir === "asc" ? 1 : -1 };

        // Filtros dinámicos
        const query = {};

        // 🔍 Búsqueda global
        if (searchValue) {
            const regex = new RegExp(searchValue, "i");
            query.$or = [
                { module: regex },
                { action: regex },
                { user_name: regex },
                { description: regex },
                { ip: regex }
            ];

            // si busca por id numérico
            const asNumber = Number(searchValue);
            if (!isNaN(asNumber)) {
                query.$or.push({ user_id: asNumber });
            }
        }

        // 🔎 Filtros de columna individuales
        if (req.query.columns) {
            Object.values(req.query.columns).forEach(col => {
                if (col.search && col.search.value) {
                    const value = col.search.value.trim();
                    if (!value) return;

                    if (["user_id"].includes(col.data)) {
                        query[col.data] = Number(value);
                    } else {
                        query[col.data] = new RegExp(value, "i");
                    }
                }
            });
        }

        // ⏱️ Filtro por rango de fechas
        const { desde, hasta } = req.query;
        if (desde || hasta) {
            query.created_at = {};
            if (desde) {
                const desdeDate = desde.length === 10 ? `${desde}T00:00:00` : desde;
                query.created_at.$gte = new Date(desdeDate);
            }
            if (hasta) {
                const hastaDate = hasta.length === 10 ? `${hasta}T23:59:59` : hasta;
                query.created_at.$lte = new Date(hastaDate);
            }
        }

        // 📊 Conteos
        const recordsTotal = await SystemLog.countDocuments({});
        const recordsFiltered = await SystemLog.countDocuments(query);

        // 📋 Datos paginados
        const data = await SystemLog.find(query)
            .sort(sort)
            .skip(start)
            .limit(length)
            .lean();

        res.json({
            draw,
            recordsTotal,
            recordsFiltered,
            data
        });
    } catch (error) {
        console.error("❌ Error en getAllDatatable logs:", error);
        res.status(500).json({ message: "Error al obtener logs del sistema" });
    }
};

module.exports = {
    getLogs,
    getRecentLogs,
    getAllDatatable
};

