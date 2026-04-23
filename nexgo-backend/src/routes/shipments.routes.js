const express      = require('express');
const shipmentsCtrl = require('../controllers/shipments.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticate);

// Crear envío (CLIENTE, ADMIN, GESTOR y Tiers de Cliente)
router.post('/', authorize('CLIENTE', 'ADMIN', 'GESTOR_ADMINISTRATIVO', 'FULL_CUSTOMER', 'GOLD_CUSTOMER', 'SILVER_CUSTOMER', 'BRONZE_CUSTOMER'), shipmentsCtrl.createShipment);

// Listar envíos (todos los roles, filtrado internamente por rol)
router.get('/', shipmentsCtrl.getShipments);

// Detalle de envío
router.get('/:id', shipmentsCtrl.getShipmentById);

// Actualizar estado (REPARTIDOR, ADMIN, GESTOR)
router.put('/:id/status', authorize('REPARTIDOR', 'ADMIN', 'GESTOR_ADMINISTRATIVO'), shipmentsCtrl.updateStatus);

// Asignar repartidor (ADMIN, GESTOR)
router.put('/:id/assign', authorize('ADMIN', 'GESTOR_ADMINISTRATIVO'), shipmentsCtrl.assignDriver);

module.exports = router;
