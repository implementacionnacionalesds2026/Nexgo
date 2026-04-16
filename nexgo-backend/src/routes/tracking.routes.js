const express       = require('express');
const trackingCtrl  = require('../controllers/tracking.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticate);

// Repartidor actualiza su ubicación
router.post('/ubicacion', authorize('REPARTIDOR', 'ADMIN'), trackingCtrl.updateLocation);

// Admin ve todos los repartidores activos
router.get('/repartidores', authorize('ADMIN'), trackingCtrl.getActiveDrivers);

// Historial de un repartidor
router.get('/historial/:driverId', authorize('ADMIN'), trackingCtrl.getDriverHistory);

module.exports = router;
