require('dotenv').config();
const shipmentsService = require('./services/shipments.service');

async function test() {
  try {
    const id = 'd8223494-cb6f-419c-825d-7b599749e938';
    console.log("Testing shipmentService with:", id);
    const shipment = await shipmentsService.getShipmentById(id);
    console.log("Success! Shipment client:", shipment.client_id);
  } catch (err) {
    console.error("Service Error:", err.statusCode, err.message);
  } finally {
    process.exit();
  }
}
test();
