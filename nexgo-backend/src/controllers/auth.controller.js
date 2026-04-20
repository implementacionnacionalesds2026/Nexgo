const authService   = require('../services/auth.service');
const { successResponse } = require('../utils/helpers');
const { validationResult } = require('express-validator');

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const loginId = (username || email || '').trim();

    logger.info(`Intento de login para: ${loginId}`);

    if (!loginId || !password) {
      return res.status(401).json({ success: false, message: 'Credenciales incompletas' });
    }

    const result = await authService.login(loginId, password);

    return successResponse(res, result, 'Login exitoso');
  } catch (err) {
    logger.error(`Error en login: ${err.message}`);
    next(err);
  }
};

/**
 * POST /api/auth/register  (ADMIN only)
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: 'Datos inválidos', errors: errors.array() });
    }

    const user = await authService.register(req.body);
    return successResponse(res, user, 'Usuario creado exitosamente', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    return successResponse(res, profile);
  } catch (err) {
    next(err);
  }
};

module.exports = { login, register, getMe };
