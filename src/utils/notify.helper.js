const Notification = require('../models/mongo/notification.model');

const notifyUser = async ({ user_id, title, message, link = '' }) => {
    try {
        await Notification.create({
            user_id,
            title,
            message,
            link
        });
    } catch (err) {
        console.error('❌ Error al crear notificación:', err.message);
    }
};

module.exports = { notifyUser };
