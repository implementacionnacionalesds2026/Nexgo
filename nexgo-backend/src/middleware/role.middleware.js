const logger = require('../utils/logger');

/**
 * Genera un middleware de autorización por rol(es)
 * @param {...string} allowedRoles - Roles permitidos (ej: 'ADMIN', 'CLIENTE')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado',
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      logger.warn(`Acceso denegado: usuario ${req.user.email} (${userRole}) intentó acceder a recurso reservado para [${allowedRoles.join(', ')}]`);
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción',
      });
    }

    next();
  };
};

module.exports = { authorize };
