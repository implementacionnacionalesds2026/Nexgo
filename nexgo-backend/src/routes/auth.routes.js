const express    = require('express');
const { body }   = require('express-validator');
const authCtrl   = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

const router = express.Router();

// POST /api/auth/login
router.post('/login', [
  body('password').notEmpty().withMessage('Contraseña requerida'),
], authCtrl.login);

// POST /api/auth/register (Solo ADMIN)
router.post('/register', authenticate, authorize('ADMIN'), [
  body('name').notEmpty().withMessage('Nombre requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('roleId').isInt().withMessage('Rol requerido'),
], authCtrl.register);

// GET /api/auth/me
router.get('/me', authenticate, authCtrl.getMe);

module.exports = router;
