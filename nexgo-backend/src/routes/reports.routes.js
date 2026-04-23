const express      = require('express');
const reportsCtrl  = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticate, authorize('ADMIN', 'GESTOR_ADMINISTRATIVO'));

router.get('/dashboard', reportsCtrl.getDashboard);
router.get('/shipments', reportsCtrl.getShipmentsReport);

module.exports = router;
