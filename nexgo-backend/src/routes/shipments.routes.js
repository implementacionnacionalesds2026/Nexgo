const express      = require('express');
const shipmentsCtrl = require('../controllers/shipments.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize }    = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticate);

// Crear envío (ADMIN, GESTOR y todos los niveles de Cliente)
router.post('/', authorize('ADMIN', 'GESTOR_ADMINISTRATIVO', 'CLIENTE', 'SMALL_CUSTOMER', 'AVERAGE_CUSTOMER', 'FULL_CUSTOMER'), shipmentsCtrl.createShipment);

// Listar envíos (todos los roles, filtrado internamente por rol)
router.get('/', shipmentsCtrl.getShipments);

// Detalle de envío
router.get('/:id', shipmentsCtrl.getShipmentById);

// Actualizar estado (REPARTIDOR, ADMIN, GESTOR)
router.put('/:id/status', authorize('REPARTIDOR', 'ADMIN', 'GESTOR_ADMINISTRATIVO'), shipmentsCtrl.updateStatus);

// Asignar repartidor (ADMIN, GESTOR)
router.put('/:id/assign', authorize('ADMIN', 'GESTOR_ADMINISTRATIVO'), shipmentsCtrl.assignDriver);

module.exports = router;
