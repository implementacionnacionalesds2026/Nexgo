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
    const { 
      name, 
      basePrice, base_price,
      pricePerKg, price_per_kg,
      pricePerKm, price_per_km,
      pricePerExtraPkg, price_per_extra_pkg,
      dimensionSurcharge, dimension_surcharge,
      maxWeightKg, max_weight_kg,
      isActive, is_active,
      baseWeight, base_weight,
      weightUnit, weight_unit,
      extraWeightPrice, extra_weight_price,
      roleId, role_id,
      userId, user_id
    } = req.body;

    // 1. Obtener valores antiguos para el historial
    const oldRes = await query('SELECT * FROM pricing_rules WHERE id = $1', [req.params.id]);
    const oldValues = oldRes.rows[0];

    const result = await query(
      `UPDATE pricing_rules
       SET name = COALESCE($1, name),
           base_price = COALESCE($2, $3, base_price),
           price_per_kg = COALESCE($4, $5, price_per_kg),
           price_per_km = COALESCE($6, $7, price_per_km),
           price_per_extra_pkg = COALESCE($8, $9, price_per_extra_pkg),
           dimension_surcharge = COALESCE($10, $11, dimension_surcharge),
           max_weight_kg = COALESCE($12, $13, max_weight_kg),
           is_active = COALESCE($14, $15, is_active),
           base_weight = COALESCE($16, $17, base_weight),
           weight_unit = COALESCE($18, $19, weight_unit),
           extra_weight_price = COALESCE($20, $21, extra_weight_price),
           role_id = COALESCE($22, $23, role_id),
           user_id = COALESCE($24, $25, user_id),
           updated_at = NOW()
       WHERE id = $26
       RETURNING *`,
      [
        name, 
        basePrice, base_price,
        pricePerKg, price_per_kg,
        pricePerKm, price_per_km,
        pricePerExtraPkg, price_per_extra_pkg,
        dimensionSurcharge, dimension_surcharge,
        maxWeightKg, max_weight_kg,
        isActive, is_active,
        baseWeight, base_weight,
        weightUnit, weight_unit,
        extraWeightPrice, extra_weight_price,
        roleId, role_id,
        userId, user_id,
        req.params.id
      ]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Tarifa no encontrada' });
    }

    // 2. Registrar en historial
    await query(
      'INSERT INTO pricing_history (pricing_rule_id, changed_by, old_values, new_values) VALUES ($1, $2, $3, $4)',
      [req.params.id, req.user.id, JSON.stringify(oldValues), JSON.stringify(result.rows[0])]
    );

    logger.info(`Tarifa actualizada: ${req.params.id} por usuario ${req.user.id}`);
    return successResponse(res, result.rows[0], 'Tarifa actualizada');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/pricing/:id/history
 */
const getPricingHistory = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT h.*, u.name as admin_name 
       FROM pricing_history h 
       JOIN users u ON h.changed_by = u.id 
       WHERE h.pricing_rule_id = $1 
       ORDER BY h.created_at DESC`,
      [req.params.id]
    );
    return successResponse(res, result.rows);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/pricing
 */
const createPricingRule = async (req, res, next) => {
  try {
    const { 
      name, 
      base_price, basePrice,
      price_per_kg, pricePerKg,
      price_per_km, pricePerKm,
      price_per_extra_pkg, pricePerExtraPkg,
      dimension_surcharge, dimensionSurcharge,
      max_weight_kg, maxWeightKg,
      base_weight, baseWeight,
      weight_unit, weightUnit,
      extra_weight_price, extraWeightPrice,
      role_id, roleId,
      user_id, userId
    } = req.body;

    const result = await query(
      `INSERT INTO pricing_rules (
        name, base_price, price_per_kg, price_per_km, price_per_extra_pkg, 
        dimension_surcharge, max_weight_kg, base_weight, weight_unit, 
        extra_weight_price, role_id, user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        name, 
        base_price || basePrice, 
        price_per_kg || pricePerKg || 0, 
        price_per_km || pricePerKm || 0, 
        price_per_extra_pkg || pricePerExtraPkg || 0, 
        dimension_surcharge || dimensionSurcharge || 0, 
        max_weight_kg || maxWeightKg || 100,
        base_weight || baseWeight || 0,
        weight_unit || weightUnit || 'LB',
        extra_weight_price || extraWeightPrice || 0,
        role_id || roleId,
        user_id || userId
      ]
    );

    // Registrar creación en historial
    await query(
      'INSERT INTO pricing_history (pricing_rule_id, changed_by, old_values, new_values) VALUES ($1, $2, $3, $4)',
      [result.rows[0].id, req.user.id, null, JSON.stringify(result.rows[0])]
    );

    return successResponse(res, result.rows[0], 'Tarifa creada', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { getPricingRules, updatePricingRule, createPricingRule, getPricingHistory };
