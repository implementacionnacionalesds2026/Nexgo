const { query }  = require('../config/database');
const { isValidGuatemalaCoords } = require('../utils/helpers');
const logger     = require('../utils/logger');

/**
 * Registrar/actualizar ubicación de un repartidor
 */
const updateLocation = async (driverId, { latitude, longitude, shipmentId, speedKmh, heading }, io) => {
  if (!isValidGuatemalaCoords(latitude, longitude)) {
    throw Object.assign(new Error('Coordenadas fuera del rango válido para Guatemala'), { statusCode: 400 });
  }

  // Marcar ubicaciones anteriores como inactivas
  await query(
    'UPDATE delivery_tracking SET is_active = FALSE WHERE driver_id = $1',
    [driverId]
  );

  // Insertar nueva ubicación
  const result = await query(
    `INSERT INTO delivery_tracking (driver_id, shipment_id, latitude, longitude, speed_kmh, heading, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)
     RETURNING *`,
    [driverId, shipmentId, latitude, longitude, speedKmh, heading]
  );

  const locationData = result.rows[0];

  // Emitir por Socket.io a administradores
  if (io) {
    io.to('admins').emit('tracking:location_update', {
      driverId,
      shipmentId,
      latitude,
      longitude,
      speedKmh,
      recordedAt: locationData.recorded_at,
    });
  }

  logger.debug(`Ubicación actualizada: driver ${driverId} -> [${latitude}, ${longitude}]`);
  return locationData;
};

/**
 * Obtener última ubicación de todos los repartidores activos
 */
const getActiveDriverLocations = async () => {
  const result = await query(
    `SELECT dt.*, u.name AS driver_name, u.phone AS driver_phone,
            s.tracking_number, s.current_status,
            s.destination_city
     FROM delivery_tracking dt
     JOIN users u ON u.id = dt.driver_id
     LEFT JOIN shipments s ON s.id = dt.shipment_id
     WHERE dt.is_active = TRUE
     ORDER BY dt.recorded_at DESC`
  );

  return result.rows;
};

/**
 * Obtener historial de ubicaciones de un repartidor
 */
const getDriverHistory = async (driverId, limit = 100) => {
  const result = await query(
    `SELECT * FROM delivery_tracking
     WHERE driver_id = $1
     ORDER BY recorded_at DESC
     LIMIT $2`,
    [driverId, limit]
  );

  return result.rows;
};

module.exports = { updateLocation, getActiveDriverLocations, getDriverHistory };
