const mongoose = require('mongoose');

const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🟢 Conectado a MongoDB');
    } catch (error) {
        console.error('🔴 Error conectando a MongoDB:', error.message);
    }
};

module.exports = connectMongo;
