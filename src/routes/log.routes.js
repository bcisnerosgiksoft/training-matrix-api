const express = require('express');
const router = express.Router();
const { getLogs, getRecentLogs, getAllDatatable } = require('../controllers/log.controller');
const { validateToken } = require('../middlewares/auth.middleware');

// Protegemos con token, así solo usuarios logueados pueden ver logs
router.get('/', validateToken, getLogs);
router.get('/datatable', validateToken, getAllDatatable);
// 🆕 Ruta para actividad reciente
router.get('/recent', validateToken, getRecentLogs);

module.exports = router;
