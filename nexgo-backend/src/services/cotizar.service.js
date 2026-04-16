const { query }  = require('../config/database');
const { calculateShipmentCost } = require('../utils/helpers');

/**
 * Cotizar un envío basado en parámetros y tarifas activas
 */
const cotizarEnvio = async ({ weightKg, distanceKm, quantity, lengthCm, widthCm, heightCm, pricingRuleId }) => {
  let rulesQuery;

  if (pricingRuleId) {
    rulesQuery = await query(
      'SELECT * FROM pricing_rules WHERE id = $1 AND is_active = TRUE',
      [pricingRuleId]
    );
  } else {
    // Devolver cotizaciones con todas las tarifas activas
    rulesQuery = await query('SELECT * FROM pricing_rules WHERE is_active = TRUE ORDER BY base_price ASC');
  }

  if (rulesQuery.rows.length === 0) {
    throw Object.assign(new Error('No hay tarifas disponibles'), { statusCode: 404 });
  }

  const cotizaciones = rulesQuery.rows.map((rule) => {
    const cost = calculateShipmentCost(rule, {
      weightKg:  parseFloat(weightKg)   || 0,
      distanceKm: parseFloat(distanceKm) || 0,
      quantity:  parseInt(quantity)      || 1,
      lengthCm:  parseFloat(lengthCm)   || 0,
      widthCm:   parseFloat(widthCm)    || 0,
      heightCm:  parseFloat(heightCm)   || 0,
    });

    return {
      ruleId:      rule.id,
      ruleName:    rule.name,
      basePrice:   rule.base_price,
      totalCost:   cost,
      breakdown: {
        baseCost:      rule.base_price,
        weightCost:    +(weightKg * rule.price_per_kg).toFixed(2),
        distanceCost:  +(distanceKm * rule.price_per_km).toFixed(2),
        extraPkgCost:  quantity > 1 ? +((quantity - 1) * rule.price_per_extra_pkg).toFixed(2) : 0,
      },
    };
  });

  return cotizaciones;
};

module.exports = { cotizarEnvio };
