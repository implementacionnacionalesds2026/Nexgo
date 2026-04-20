const { query }  = require('../config/database');
const { generateTrackingNumber, calculateShipmentCost } = require('../utils/helpers');
const logger     = require('../utils/logger');

/**
 * Crear un nuevo envío
 */
const createShipment = async (data, clientId) => {
  const {
    senderName, senderPhone, senderAddress, originCity, originLat, originLng,
    recipientName, recipientPhone, recipientAddress, destinationCity, destinationLat, destinationLng,
    recipientMunicipality, recipientDepartment, recipientZone,
    weightKg, lengthCm, widthCm, heightCm, quantity, description, isFragile,
    totalPaymentAmount, paymentInstructions, orderNumber, ticketNumber,
    destinationCode, serviceTag, comments,
    distanceKm, pricingRuleId,
  } = data;

  // Autoincremento de Orden y Ticket por empresa (Manejo robusto de errores de casting)
  let autoOrderNumber = "1";
  let autoTicketNumber = "1";
  
  try {
    const lastNumbersResult = await query(
      `SELECT 
        MAX(CASE WHEN order_number ~ '^[0-9]+$' THEN CAST(order_number AS INTEGER) ELSE 0 END) as last_order,
        MAX(CASE WHEN ticket_number ~ '^[0-9]+$' THEN CAST(ticket_number AS INTEGER) ELSE 0 END) as last_ticket
       FROM shipments WHERE client_id = $1`,
      [clientId]
    );
    
    const lastOrder = lastNumbersResult.rows[0].last_order || 0;
    const lastTicket = lastNumbersResult.rows[0].last_ticket || 0;
    
    autoOrderNumber = (lastOrder + 1).toString();
    autoTicketNumber = (lastTicket + 1).toString();
  } catch (seqError) {
    logger.error('Error calculando correlativo, usando fallback 1:', seqError);
  }

  // Obtener tarifa y calcular costo
  let estimatedCost = null;
  if (pricingRuleId && distanceKm) {
    const ruleResult = await query('SELECT * FROM pricing_rules WHERE id = $1 AND is_active = TRUE', [pricingRuleId]);
    if (ruleResult.rows[0]) {
      estimatedCost = calculateShipmentCost(ruleResult.rows[0], {
        weightKg, distanceKm, quantity, lengthCm, widthCm, heightCm,
      });
    }
  }

  const trackingNumber = generateTrackingNumber();

  const result = await query(
    `INSERT INTO shipments (
      tracking_number, client_id, pricing_rule_id,
      sender_name, sender_phone, sender_address, origin_city, origin_lat, origin_lng,
      recipient_name, recipient_phone, recipient_address, destination_city, destination_lat, destination_lng,
      recipient_municipality, recipient_department, recipient_zone,
      weight_kg, length_cm, width_cm, height_cm, quantity, description, is_fragile,
      total_payment_amount, payment_instructions, order_number, ticket_number,
      destination_code, service_tag, comments,
      distance_km, estimated_cost, final_cost, current_status
    ) VALUES (
      $1,$2,$3,
      $4,$5,$6,$7,$8,$9,
      $10,$11,$12,$13,$14,$15,
      $16,$17,$18,
      $19,$20,$21,$22,$23,$24,$25,
      $26,$27,$28,$29,
      $30,$31,$32,
      $33,$34,$34,'PENDIENTE'
    ) RETURNING *`,
    [
      trackingNumber, clientId, pricingRuleId,
      senderName, senderPhone, senderAddress, originCity, originLat, originLng,
      recipientName, recipientPhone, recipientAddress, destinationCity, destinationLat, destinationLng,
      recipientMunicipality, recipientDepartment, recipientZone,
      weightKg, lengthCm, widthCm, heightCm, quantity || 1, description, isFragile || false,
      totalPaymentAmount, paymentInstructions, autoOrderNumber, autoTicketNumber,
      destinationCode, serviceTag, comments,
      distanceKm, estimatedCost
    ]
  );

  const shipment = result.rows[0];

  // Registrar estado inicial
  await query(
    `INSERT INTO shipment_status (shipment_id, status, notes, updated_by)
     VALUES ($1, 'PENDIENTE', '', $2)`,
    [shipment.id, clientId]
  );

  logger.info(`Nuevo envío creado: ${trackingNumber} por cliente ${clientId}`);
  return shipment;
};

/**
 * Listar envíos con filtros
 */
const getShipments = async (filters = {}) => {
  const { clientId, driverId, status, month, year, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;
  const params = [];
  const conditions = [];

  if (clientId) {
    params.push(clientId);
    conditions.push(`s.client_id = $${params.length}`);
  }
  if (driverId) {
    params.push(driverId);
    conditions.push(`s.assigned_driver_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`s.current_status = $${params.length}`);
  }
  if (month) {
    params.push(month);
    conditions.push(`EXTRACT(MONTH FROM s.created_at) = $${params.length}`);
  }
  if (year) {
    params.push(year);
    conditions.push(`EXTRACT(YEAR FROM s.created_at) = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit, offset);
  const result = await query(
    `SELECT s.*,
            uc.name AS client_name, uc.company_name,
            ud.name AS driver_name
     FROM shipments s
     LEFT JOIN users uc ON uc.id = s.client_id
     LEFT JOIN users ud ON ud.id = s.assigned_driver_id
     ${whereClause}
     ORDER BY s.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  // Conteo total
  const countParams = params.slice(0, params.length - 2);
  const countResult = await query(
    `SELECT COUNT(*) FROM shipments s ${whereClause}`,
    countParams
  );

  return {
    data:  result.rows,
    total: parseInt(countResult.rows[0].count),
    page:  parseInt(page),
    limit: parseInt(limit),
  };
};

/**
 * Obtener envío por ID
 */
const getShipmentById = async (id) => {
  // Evitar error de PostgreSQL al comparar UUID con VARCHAR 
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const whereClause = isUuid ? 's.id = $1' : 's.tracking_number = $1';

  const result = await query(
    `SELECT s.*,
            uc.name AS client_name, uc.email AS client_email, uc.company_name,
            ud.name AS driver_name, ud.phone AS driver_phone
     FROM shipments s
     LEFT JOIN users uc ON uc.id = s.client_id
     LEFT JOIN users ud ON ud.id = s.assigned_driver_id
     WHERE ${whereClause}`,
    [id]
  );

  if (!result.rows[0]) {
    throw Object.assign(new Error('Envío no encontrado'), { statusCode: 404 });
  }

  // Historial de estados
  const statusHistory = await query(
    `SELECT ss.*, u.name AS updated_by_name, u.username AS updated_by_username, r.name AS updated_by_role
     FROM shipment_status ss
     LEFT JOIN users u ON u.id = ss.updated_by
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE ss.shipment_id = $1
     ORDER BY ss.created_at DESC`,
    [result.rows[0].id]
  );

  return { ...result.rows[0], statusHistory: statusHistory.rows };
};

/**
 * Actualizar estado de un envío
 */
const updateShipmentStatus = async (shipmentId, status, notes, updatedBy, io) => {
  const validStatuses = ['PENDIENTE', 'RECOGIDO', 'EN_TRANSITO', 'EN_DESTINO', 'ENTREGADO', 'CANCELADO'];
  if (!validStatuses.includes(status)) {
    throw Object.assign(new Error(`Estado inválido. Use: ${validStatuses.join(', ')}`), { statusCode: 400 });
  }

  await query(
    'UPDATE shipments SET current_status = $1, updated_at = NOW() WHERE id = $2',
    [status, shipmentId]
  );

  await query(
    `INSERT INTO shipment_status (shipment_id, status, notes, updated_by)
     VALUES ($1, $2, $3, $4)`,
    [shipmentId, status, notes, updatedBy]
  );

  // Emitir evento en tiempo real
  if (io) {
    io.emit(`shipment:${shipmentId}:status`, { status, notes, updatedAt: new Date() });
    io.to('admins').emit('shipment:status_changed', { shipmentId, status });
  }

  logger.info(`Envío ${shipmentId} actualizado a: ${status}`);
  return { shipmentId, status, updatedAt: new Date() };
};

/**
 * Asignar repartidor a un envío
 */
const assignDriver = async (shipmentId, driverId) => {
  const result = await query(
    `UPDATE shipments SET assigned_driver_id = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [driverId, shipmentId]
  );

  if (!result.rows[0]) {
    throw Object.assign(new Error('Envío no encontrado'), { statusCode: 404 });
  }

  return result.rows[0];
};

module.exports = { createShipment, getShipments, getShipmentById, updateShipmentStatus, assignDriver };
