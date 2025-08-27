const Class = require('../models/mysql/class.model');

const seedClasses = async () => {
    const defaultClasses = [
        { name: 'Class #1 MANO DE OBRA DIRECTA ' },
        { name: 'Class #2 MANO DE OBRA INDIRECTA ' },
        { name: 'Class #3 INDIRECTOS ' },
        { name: 'Class #4 ADMINISTRATIVOS ' },
    ];

    for (const c of defaultClasses) {
        const exists = await Class.findOne({ where: { name: c.name } });
        if (!exists) {
            await Class.create(c);
            console.log(`✅ Clase "${c.name}" insertada`);
        }
    }
};

module.exports = seedClasses;
