const Shift = require('../models/mysql/shift.model');

const seedShifts = async () => {
    const shifts = [
        {
            name: '1ER TURNO  07:00 a 07:00 48 HRS',
            start_time: '07:00:00',
            end_time: '19:00:00'
        },
        {
            name: '2DO TURNO 42 HORAS',
            start_time: '07:00:00',
            end_time: '17:00:00'
        }
    ];

    for (const shift of shifts) {
        const exists = await Shift.findOne({ where: { name: shift.name } });
        if (!exists) {
            await Shift.create(shift);
            console.log(`✅ Turno "${shift.name}" insertado`);
        }
    }
};

module.exports = seedShifts;
