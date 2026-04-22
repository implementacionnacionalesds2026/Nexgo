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

const calculateShipmentCost = (rule, { weightKg, distanceKm, quantity, lengthCm, widthCm, heightCm }) => {
  // 1. Costo base
  let cost = parseFloat(rule.base_price) || 0;

  // 2. Costo por excedente de peso
  const baseWeight = parseFloat(rule.base_weight) || 0;
  const currentWeight = parseFloat(weightKg) || 0;
  const extraPrice = parseFloat(rule.extra_weight_price) || 0;

  if (currentWeight > baseWeight) {
    const extraWeight = currentWeight - baseWeight;
    cost += extraWeight * extraPrice;
  }

  // 3. Multiplicar por cantidad (en Nexgo se cobra por bulto/guía si son múltiples piezas)
  cost = cost * (parseFloat(quantity) || 1);

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
