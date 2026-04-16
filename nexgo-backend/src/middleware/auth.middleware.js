const { verifyToken } = require('../config/jwt');
const logger = require('../utils/logger');

/**
 * Middleware de autenticación JWT
 * Verifica el token Bearer en el header Authorization
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    logger.warn(`Token inválido: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
    });
  }
};

module.exports = { authenticate };
