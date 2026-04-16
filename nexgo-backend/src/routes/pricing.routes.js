const express      = require('express');
const pricingCtrl  = require('../controllers/pricing.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/',     pricingCtrl.getPricingRules);
router.post('/',    pricingCtrl.createPricingRule);
router.put('/:id',  pricingCtrl.updatePricingRule);

module.exports = router;
