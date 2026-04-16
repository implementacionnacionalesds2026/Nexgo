const cotizarService = require('../services/cotizar.service');
const { successResponse } = require('../utils/helpers');

/**
 * POST /api/cotizar
 * Calcula el costo estimado de un envío
 */
const cotizar = async (req, res, next) => {
  try {
    const { weightKg, distanceKm, quantity, lengthCm, widthCm, heightCm, pricingRuleId } = req.body;

    if (!weightKg || !distanceKm) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren al mínimo: weightKg y distanceKm',
      });
    }

    const cotizaciones = await cotizarService.cotizarEnvio({
      weightKg, distanceKm, quantity, lengthCm, widthCm, heightCm, pricingRuleId,
    });

    return successResponse(res, {
      cotizaciones,
      parametros: { weightKg, distanceKm, quantity: quantity || 1 },
    }, 'Cotización calculada');
  } catch (err) {
    next(err);
  }
};

module.exports = { cotizar };
