// src/controllers/notification.controller.js
const Notification = require('../models/mongo/notification.model');

const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user_id: req.user.id }).sort({ created_at: -1 });
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener notificaciones' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOneAndUpdate(
            { _id: id, user_id: req.user.id },
            { read: true },
            { new: true }
        );

        if (!notification) return res.status(404).json({ message: 'Notificación no encontrada' });

        res.json({ message: 'Notificación marcada como leída', notification });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al marcar como leída' });
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Notification.findOneAndDelete({ _id: id, user_id: req.user.id });

        if (!deleted) return res.status(404).json({ message: 'Notificación no encontrada' });

        res.json({ message: 'Notificación eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar notificación' });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    remove
};
