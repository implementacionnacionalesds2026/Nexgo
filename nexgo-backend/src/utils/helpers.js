const { v4: uuidv4 } = require('uuid');

/**
 * Genera un número de tracking único para un envío
 * Formato: NX-YYYY-XXXXX
 */
const generateTrackingNumber = () => {
  const year    = new Date().getFullYear();
  const random  = Math.floor(10000 + Math.random() * 90000);
  return `NX-${year}-${random}`;
};

/**
 * Formatea la respuesta de éxito estándar
 */
const successResponse = (res, data, message = 'OK', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Formatea la respuesta de error estándar
 */
const errorResponse = (res, message, statusCode = 400, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};

/**
 * Calcula el costo de un envío basado en las tarifas
 */
const calculateShipmentCost = (rule, { weightKg, distanceKm, quantity, lengthCm, widthCm, heightCm }) => {
  let cost = rule.base_price;

  // Cargo por peso
  cost += weightKg * rule.price_per_kg;

  // Cargo por distancia
  cost += distanceKm * rule.price_per_km;

  // Cargo por paquetes adicionales
  if (quantity > 1) {
    cost += (quantity - 1) * rule.price_per_extra_pkg;
  }

  // Recargo por dimensiones grandes (si el volumen supera 100L)
  if (lengthCm && widthCm && heightCm) {
    const volumeLiters = (lengthCm * widthCm * heightCm) / 1000;
    if (volumeLiters > 100) {
      cost += rule.dimension_surcharge;
    }
  }

  return Math.round(cost * 100) / 100; // Redondear a 2 decimales
};

/**
 * Validación de coordenadas de Guatemala
 * Bounds aproximados: lat 13.7-18.0, lng -92.3 a -88.2
 */
const isValidGuatemalaCoords = (lat, lng) => {
  return lat >= 13.7 && lat <= 18.0 && lng >= -92.3 && lng <= -88.2;
};

/**
 * Sanitiza un objeto eliminando campos undefined
 */
const sanitizeObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
};

module.exports = {
  generateTrackingNumber,
  successResponse,
  errorResponse,
  calculateShipmentCost,
  isValidGuatemalaCoords,
  sanitizeObject,
};
