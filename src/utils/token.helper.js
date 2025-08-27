const BlacklistedToken = require('../models/mongo/blacklistedToken.model');

const addTokenToBlacklist = async (token, user_id, reason = 'manual') => {
    const durationStr = process.env.JWT_EXPIRES_IN || '1d';
    const durationSec = Number(durationStr.replace(/[^\d]/g, '')) || 86400;

    const expires_at = new Date(Date.now() + durationSec * 1000);

    await BlacklistedToken.create({
        token,
        user_id,
        reason,
        expires_at
    });
};

module.exports = { addTokenToBlacklist };
