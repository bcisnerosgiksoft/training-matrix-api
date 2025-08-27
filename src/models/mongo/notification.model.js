const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user_id: { type: Number, required: true }, // id del usuario receptor
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String }, // ruta del sistema (opcional)
    read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
