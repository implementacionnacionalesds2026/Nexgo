const express     = require('express');
const cotizarCtrl = require('../controllers/cotizar.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/cotizar (autenticado)
router.post('/', authenticate, cotizarCtrl.cotizar);

module.exports = router;
