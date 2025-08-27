const mongoose = require('mongoose');

const BlacklistedTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    user_id: { type: Number, required: true },
    reason: { type: String, default: 'logout' },
    created_at: { type: Date, default: Date.now },
    expires_at: { type: Date, required: true }
});

// MongoDB eliminará automáticamente los tokens expirados
BlacklistedTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('BlacklistedToken', BlacklistedTokenSchema);
