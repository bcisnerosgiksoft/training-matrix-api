const express = require('express');
const router = express.Router();
const { validateToken } = require('../middlewares/auth.middleware');
const notificationController = require('../controllers/notification.controller');

// Obtener todas las notificaciones del usuario autenticado
router.get('/', validateToken, notificationController.getNotifications);

// Marcar una notificación como leída
router.patch('/:id/read', validateToken, notificationController.markAsRead);

// Eliminar una notificación
router.delete('/:id', validateToken, notificationController.remove);

module.exports = router;
