const jwt = require('jsonwebtoken');

const JWT_SECRET      = process.env.JWT_SECRET || 'nexgo_dev_secret';
const JWT_EXPIRES_IN  = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Genera un token JWT para un usuario
 * @param {Object} payload - Datos del usuario
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verifica y decodifica un token JWT
 * @param {string} token
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateToken, verifyToken, JWT_SECRET };
