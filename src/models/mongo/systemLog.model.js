// src/models/mongo/systemLog.model.js
const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
    user_id: { type: Number, required: true },
    user_name: { type: String }, // 👈 Nombre del usuario que hizo la acción
    action: { type: String, required: true },
    module: { type: String, required: true },
    description: { type: String, required: true },
    ip: { type: String },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemLog', systemLogSchema);
