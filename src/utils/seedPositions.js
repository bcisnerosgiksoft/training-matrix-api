const Position = require('../models/mysql/position.model');

const seedPositions = async () => {
    const positions = [
        { name: "ALMACENISTA", description: null },
        { name: "AUDITOR DE CALIDAD", description: null },
        { name: "BUYER", description: null },
        { name: "CICLOCUENTISTA", description: null },
        { name: "CLERK DE RECIBO", description: null },
        { name: "COORDINADOR DE RECURSOS HUMANOS Y ENTRENAMIENTO", description: null },
        { name: "CUSTOMER SERVICE - BUYER", description: null },
        { name: "DISEÑADOR CAD", description: null },
        { name: "ELECTROMECANICO", description: null },
        { name: "ENFERMERA/TECNICO SEGURIDAD E HIGIENE", description: null },
        { name: "GERENTE DE INGENIERIA", description: null },
        { name: "GERENTE DE SEGURIDAD E HIGIENE", description: null },
        { name: "INGENIERO CNC", description: null },
        { name: "INGENIERO DE CALIDAD", description: null },
        { name: "INGENIERO DE MOLDES", description: null },
        { name: "INGENIERO EN PROCESOS", description: null },
        { name: "JEFE DE GRUPO", description: null },
        { name: "JEFE DE GRUPO DE CICLOCUENTOS", description: null },
        { name: "JEFE DE GRUPO DE EMBARQUES", description: null },
        { name: "MAQUINISTA", description: null },
        { name: "MATERIALISTA", description: null },
        { name: "OPERADOR CNC", description: null },
        { name: "OPERADOR DE PRODUCCIÓN", description: null },
        { name: "PLANNER/BUYER", description: null },
        { name: "PRODUCT SUSTAINING ENGINEER", description: null },
        { name: "PROGRAMADOR CNC", description: null },
        { name: "SET UP CNC LEAD", description: null },
        { name: "SET-UP", description: null },
        { name: "SET-UP CNC", description: null },
        { name: "SUPERVISOR DE ADUANAS", description: null },
        { name: "SUPERVISOR DE CALIDAD", description: null },
        { name: "SUPERVISOR DE MANTENIMIENTO", description: null },
        { name: "SUPERVISOR DE PRODUCCIÓN", description: null },
        { name: "SUPERVISOR DE RECIBO Y ALMACEN", description: null },
        { name: "TECNICO DE CALIDAD", description: null },
        { name: "TÉCNICO DE LIMPIEZA DE REBABA", description: null },
        { name: "TECNICO EN ENTRENAMIENTO", description: null },
        { name: "TECNICO EN MANTENIMIENTO", description: null },
        { name: "TÉCNICO EN REPARACIÓN DE MOLDES", description: null },
        { name: "TECNICO EN TORNO FRESADORA RECTIFICADORA Y MECANIC", description: null },
        { name: "TECNICO MECANICO", description: null },
        { name: "TECNICO MECANICO SR", description: null },
        { name: "TOOL MAKER CNC", description: null },
        { name: "TECNICO DE REPARACION DE MOLDES ", description: null },
    ];

    for (const position of positions) {
        const exists = await Position.findOne({ where: { name: position.name } });
        if (!exists) {
            await Position.create(position);
            console.log(`✅ Posición "${position.name}" insertada`);
        }
    }
};

module.exports = seedPositions;
