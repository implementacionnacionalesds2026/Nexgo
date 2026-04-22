const express      = require('express');
const pricingCtrl  = require('../controllers/pricing.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticate);

// Public/Client view: Solo lectura
router.get('/', pricingCtrl.getPricingRules);

// Solo Admin: Gestión
router.use(authorize('ADMIN'));
router.post('/',        pricingCtrl.createPricingRule);
router.get('/:id/history', pricingCtrl.getPricingHistory);
router.put('/:id',      pricingCtrl.updatePricingRule);

module.exports = router;
