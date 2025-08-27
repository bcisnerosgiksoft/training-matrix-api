const Area = require('../models/mysql/area.model');

const seedAreas = async () => {
    const areaNames = [
        "GENERAL",
        "ACCESS PANEL",
        "PREMIER",
        "BACKFLOW",
        "RADIANT",
        "SHUT OFF VALVE",
        "MOLDEO",
        "SEA-TECH",
        "STREAMLINE",
        "VALVULA CHECK",
        "MANIFOLD",
        "AUTOBAGGERS",
        "CALIDAD",
        "INGENIERIA ",
        "SEGURIDAD E HIGIENE ",
        "MATERIALES ",
        "MANTENIMIENTO ",
        "CNC",
        "SEA TECH MANGUERAS ",
    ];

    for (const name of areaNames) {
        const exists = await Area.findOne({ where: { name } });
        if (!exists) {
            await Area.create({ name });
            console.log(`✅ Área "${name}" insertada`);
        }
    }
};

module.exports = seedAreas;
