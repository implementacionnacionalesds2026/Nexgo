const logger = require('../utils/logger');

/**
 * Middleware global de manejo de errores
 * Debe ser el último middleware en app.js
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Error interno del servidor';

  // Errores de PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        statusCode = 409;
        message = 'Ya existe un registro con esos datos';
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Referencia a un registro inexistente';
        break;
      case '22P02': // Invalid UUID format
        statusCode = 400;
        message = 'Formato de identificador inválido';
        break;
      default:
        break;
    }
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  // Log del error
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} - ${statusCode}`, {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  } else {
    logger.warn(`[${req.method}] ${req.path} - ${statusCode}: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Manejo de rutas no encontradas
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFound };
