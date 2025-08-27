const checkPermissions = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'No autenticado. Se requiere token' });
        }

        const userPermissions = req.user.permissions;

        if (userPermissions && userPermissions[requiredPermission]) {
            return next(); // Permite que continúe al siguiente middleware o ruta
        }

        return res.status(403).json({ message: `No tienes permiso para ${requiredPermission}` });
    };
};

module.exports = { checkPermissions };
