// seedOperations.js
const Operation = require('../models/mysql/operation.model');

const seedOperations = async () => {
    const operations = [
        { name: "Operación #1", area_id: 3, is_critical: 1 },
        { name: "Operación #1", area_id: 6, is_critical: 0 },
        { name: "Operación #4", area_id: 6, is_critical: 0 },
        { name: "Operación #5", area_id: 6, is_critical: 0 },
        { name: "Operación #3", area_id: 6, is_critical: 1 },
        { name: "Operación #2", area_id: 6, is_critical: 1 },
        { name: "Operación #6", area_id: 6, is_critical: 0 },
        { name: "Operación #7", area_id: 6, is_critical: 1 },
        { name: "Operación #1", area_id: 9, is_critical: 1 },
        { name: "Operación #2", area_id: 9, is_critical: 0 },
        { name: "Operación #3", area_id: 9, is_critical: 1 },
        { name: "Operación #4", area_id: 9, is_critical: 0 },
        { name: "Operación #5", area_id: 9, is_critical: 1 },
        { name: "Operación #1", area_id: 3, is_critical: 0 },
        { name: "Operación #1", area_id: 3, is_critical: 0 },
        { name: "Operación #4", area_id: 3, is_critical: 1 },
        { name: "Operación #1", area_id: 10, is_critical: 1 },
        { name: "Operación #2", area_id: 10, is_critical: 0 },
        { name: "Operación #3", area_id: 10, is_critical: 1 },
        { name: "Operación #4", area_id: 10, is_critical: 0 },
        { name: "Operación #1", area_id: 3, is_critical: 0 },
        { name: "Operación #2", area_id: 3, is_critical: 0 },
        { name: "Operación #1", area_id: 3, is_critical: 0 },
        { name: "Operación #1", area_id: 4, is_critical: 1 },
        { name: "Operación #1", area_id: 11, is_critical: 0 },
        { name: "Operación #1", area_id: 7, is_critical: 0 },
        { name: "Operación #4", area_id: 7, is_critical: 0 },
        { name: "Operación #2", area_id: 7, is_critical: 1 },
        { name: "Operación #3", area_id: 7, is_critical: 0 },
        { name: "Operación #4", area_id: 7, is_critical: 0 },
        { name: "Operación #5", area_id: 7, is_critical: 0 },
        { name: "Operación #6", area_id: 7, is_critical: 0 },
        { name: "Operación #7", area_id: 7, is_critical: 0 },
        { name: "Operación #8", area_id: 7, is_critical: 0 },
        { name: "Operación #9", area_id: 7, is_critical: 0 },
        { name: "Operación #3", area_id: 4, is_critical: 0 },
        { name: "Operación #2", area_id: 4, is_critical: 1 },
        { name: "Operación #1", area_id: 8, is_critical: 0 },
        { name: "Operación #1", area_id: 12, is_critical: 0 },
        { name: "Operación #1", area_id: 12, is_critical: 0 },
        { name: "Operación #2", area_id: 5, is_critical: 1 },
        { name: "Operación #1", area_id: 5, is_critical: 0 },
        { name: "Operación #3", area_id: 5, is_critical: 0 },
        { name: "Operación #4", area_id: 5, is_critical: 1 },
        { name: "Operación #5", area_id: 5, is_critical: 0 },
        { name: "Operación #6", area_id: 5, is_critical: 0 },
        { name: "Operación #7", area_id: 5, is_critical: 0 },
        { name: "Operación #5", area_id: 10, is_critical: 0 },
        { name: "Operación #1", area_id: 2, is_critical: 0 },
        { name: "Operación #2", area_id: 2, is_critical: 0 },
        { name: "Operación #3", area_id: 2, is_critical: 0 },
        { name: "Operación #1", area_id: 18, is_critical: 1 },
        { name: "Operación #1", area_id: 16, is_critical: 0 },
        { name: "Operación #1", area_id: 16, is_critical: 0 },
        { name: "Operación #1", area_id: 16, is_critical: 0 },
        { name: "Operación #1", area_id: 13, is_critical: 0 },
        { name: "Operación #1", area_id: 13, is_critical: 0 },
        { name: "Operación #1", area_id: 14, is_critical: 0 },
        { name: "Operación #2", area_id: 8, is_critical: 1 },
        { name: "Operación #1", area_id: 9, is_critical: 0 },
        { name: "Operación #1", area_id: 3, is_critical: 0 },
        { name: "Operación #1", area_id: 17, is_critical: 0 },
        { name: "Operación #1", area_id: 15, is_critical: 0 },
        { name: "Operación #1", area_id: 19, is_critical: 0 }
    ];

    // Inserta todo aunque se repita
    await Operation.bulkCreate(operations);

    console.log(`✅ ${operations.length} operaciones insertadas (incluyendo duplicados)`);
};

module.exports = seedOperations;
