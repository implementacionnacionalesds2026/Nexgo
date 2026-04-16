const { query }   = require('../config/database');
const { successResponse } = require('../utils/helpers');
const logger      = require('../utils/logger');

/**
 * GET /api/pricing
 */
const getPricingRules = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM pricing_rules ORDER BY base_price ASC');
    return successResponse(res, result.rows);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/pricing/:id
 */
const updatePricingRule = async (req, res, next) => {
  try {
    const { name, basePrice, pricePerKg, pricePerKm, pricePerExtraPkg, dimensionSurcharge, maxWeightKg, isActive } = req.body;
    const result = await query(
      `UPDATE pricing_rules
       SET name = COALESCE($1, name),
           base_price = COALESCE($2, base_price),
           price_per_kg = COALESCE($3, price_per_kg),
           price_per_km = COALESCE($4, price_per_km),
           price_per_extra_pkg = COALESCE($5, price_per_extra_pkg),
           dimension_surcharge = COALESCE($6, dimension_surcharge),
           max_weight_kg = COALESCE($7, max_weight_kg),
           is_active = COALESCE($8, is_active),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name, basePrice, pricePerKg, pricePerKm, pricePerExtraPkg, dimensionSurcharge, maxWeightKg, isActive, req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Tarifa no encontrada' });
    }

    logger.info(`Tarifa actualizada: ${req.params.id}`);
    return successResponse(res, result.rows[0], 'Tarifa actualizada');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/pricing
 */
const createPricingRule = async (req, res, next) => {
  try {
    const { name, basePrice, pricePerKg, pricePerKm, pricePerExtraPkg, dimensionSurcharge, maxWeightKg } = req.body;
    const result = await query(
      `INSERT INTO pricing_rules (name, base_price, price_per_kg, price_per_km, price_per_extra_pkg, dimension_surcharge, max_weight_kg)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, basePrice, pricePerKg, pricePerKm, pricePerExtraPkg, dimensionSurcharge, maxWeightKg]
    );
    return successResponse(res, result.rows[0], 'Tarifa creada', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getPricingRules, updatePricingRule, createPricingRule };
