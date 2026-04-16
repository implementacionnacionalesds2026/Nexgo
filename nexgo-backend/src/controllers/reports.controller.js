const { query } = require('../config/database');
const { successResponse } = require('../utils/helpers');

/**
 * GET /api/reports/dashboard
 * KPIs generales del sistema
 */
const getDashboard = async (req, res, next) => {
  try {
    const [totalShipments, statusBreakdown, topClients, recentShipments, driversActive] = await Promise.all([
      // Total de envíos
      query('SELECT COUNT(*) AS total FROM shipments'),

      // Envíos por estado
      query(`SELECT current_status AS status, COUNT(*) AS total
             FROM shipments GROUP BY current_status`),

      // Top 5 clientes por cantidad de envíos
      query(`SELECT u.name, u.company_name, COUNT(s.id) AS total_envios
             FROM shipments s
             JOIN users u ON u.id = s.client_id
             GROUP BY u.id, u.name, u.company_name
             ORDER BY total_envios DESC LIMIT 5`),

      // Últimos 10 envíos
      query(`SELECT s.tracking_number, s.current_status, s.created_at,
                    s.origin_city, s.destination_city, u.company_name AS cliente
             FROM shipments s
             LEFT JOIN users u ON u.id = s.client_id
             ORDER BY s.created_at DESC LIMIT 10`),

      // Repartidores activos (con ubicación en los últimos 60 min)
      query(`SELECT COUNT(DISTINCT driver_id) AS active
             FROM delivery_tracking
             WHERE is_active = TRUE
             AND recorded_at > NOW() - INTERVAL '60 minutes'`),
    ]);

    const stats = statusBreakdown.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.total);
      return acc;
    }, {});

    return successResponse(res, {
      totalEnvios:       parseInt(totalShipments.rows[0].total),
      repartidoresActivos: parseInt(driversActive.rows[0].active),
      porEstado:         stats,
      topClientes:       topClients.rows,
      ultimosEnvios:     recentShipments.rows,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/shipments
 * Reporte detallado de envíos con filtros de fecha
 */
const getShipmentsReport = async (req, res, next) => {
  try {
    const { from, to, status, clientId, page = 1, limit = 50 } = req.query;
    const params = [];
    const conditions = [];
    const offset = (page - 1) * limit;

    if (from) { params.push(from); conditions.push(`s.created_at >= $${params.length}`); }
    if (to)   { params.push(to);   conditions.push(`s.created_at <= $${params.length}::date + 1`); }
    if (status)   { params.push(status);   conditions.push(`s.current_status = $${params.length}`); }
    if (clientId) { params.push(clientId); conditions.push(`s.client_id = $${params.length}`); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const result = await query(
      `SELECT s.tracking_number, s.current_status, s.created_at,
              s.origin_city, s.destination_city, s.weight_kg, s.quantity,
              s.estimated_cost, s.final_cost, s.distance_km,
              uc.name AS cliente, uc.company_name,
              ud.name AS repartidor
       FROM shipments s
       LEFT JOIN users uc ON uc.id = s.client_id
       LEFT JOIN users ud ON ud.id = s.assigned_driver_id
       ${where}
       ORDER BY s.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return successResponse(res, {
      data: result.rows,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getShipmentsReport };
