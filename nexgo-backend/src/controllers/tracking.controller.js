const trackingService = require('../services/tracking.service');
const { successResponse } = require('../utils/helpers');

/**
 * POST /api/tracking/ubicacion
 * Repartidor actualiza su ubicación GPS
 */
const updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, shipmentId, speedKmh, heading } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Se requieren latitud y longitud' });
    }

    const io = req.app.get('io');
    const result = await trackingService.updateLocation(
      req.user.id,
      { latitude: parseFloat(latitude), longitude: parseFloat(longitude), shipmentId, speedKmh, heading },
      io
    );

    return successResponse(res, result, 'Ubicación actualizada');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tracking/repartidores
 * Admin ve la ubicación de todos los repartidores activos
 */
const getActiveDrivers = async (req, res, next) => {
  try {
    const locations = await trackingService.getActiveDriverLocations();
    return successResponse(res, locations);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tracking/historial/:driverId
 */
const getDriverHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const history = await trackingService.getDriverHistory(req.params.driverId, limit);
    return successResponse(res, history);
  } catch (err) {
    next(err);
  }
};

module.exports = { updateLocation, getActiveDrivers, getDriverHistory };
