const Role = require('../models/mysql/role.model');

const seedRoles = async () => {
    const roles = [
        {
            name: 'Administrador',
            can_read: true,
            can_write: true,
            can_edit: true,
            can_delete: true
        },
        {
            name: 'Lectura',
            can_read: true
        },
        {
            name: 'Escritura',
            can_read: true,
            can_write: true
        },
        {
            name: 'Edición',
            can_read: true,
            can_write: true,
            can_edit: true
        }
    ];

    for (const role of roles) {
        const exists = await Role.findOne({ where: { name: role.name } });
        if (!exists) {
            await Role.create(role);
            console.log(`✅ Rol "${role.name}" insertado`);
        }
    }
};

module.exports = seedRoles;
