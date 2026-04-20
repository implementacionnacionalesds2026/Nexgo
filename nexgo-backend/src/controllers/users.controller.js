const { query }   = require('../config/database');
const bcrypt      = require('bcryptjs');
const { successResponse } = require('../utils/helpers');
const { validationResult }  = require('express-validator');
const logger      = require('../utils/logger');

/**
 * GET /api/users
 */
const getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let whereClause = '';

    if (role) {
      params.push(role.toUpperCase());
      whereClause = `WHERE r.name = $${params.length}`;
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT u.id, u.name, u.first_name, u.last_name, u.username, u.email, u.phone, u.company_name, u.is_active, u.created_at, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = role ? [role.toUpperCase()] : [];
    const countResult = await query(
      `SELECT COUNT(*) FROM users u JOIN roles r ON r.id = u.role_id ${whereClause}`,
      countParams
    );

    return successResponse(res, {
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.name, u.first_name, u.last_name, u.username, u.email, u.phone, u.company_name, u.is_active, u.created_at, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    return successResponse(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, message: 'Datos inválidos', errors: errors.array() });
    }

    const { firstName, lastName, phone, companyName, isActive, roleId } = req.body;

    // Fetch current user to compute updates
    const current = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!current.rows[0]) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    const user = current.rows[0];

    const newFirstName = firstName || user.first_name;
    const newLastName = lastName || user.last_name;
    const newName = `${newFirstName} ${newLastName}`.trim();
    const newUsername = `${newFirstName.toLowerCase().replace(/\s+/g, '')}.${newLastName.toLowerCase().replace(/\s+/g, '')}`;

    const result = await query(
      `UPDATE users
       SET name = $1,
           first_name = $2,
           last_name = $3,
           username = $4,
           phone = COALESCE($5, phone),
           company_name = COALESCE($6, company_name),
           is_active = COALESCE($7, is_active),
           role_id = COALESCE($8, role_id),
           updated_at = NOW()
       WHERE id = $9
       RETURNING id, name, username, email, phone, company_name, is_active`,
      [newName, newFirstName, newLastName, newUsername, phone, companyName, isActive, roleId, req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    logger.info(`Usuario actualizado: ${req.params.id}`);
    return successResponse(res, result.rows[0], 'Usuario actualizado');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    // Soft delete — desactivar en lugar de eliminar
    const result = await query(
      'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id, email',
      [req.params.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    logger.info(`Usuario desactivado: ${req.params.id}`);
    return successResponse(res, null, 'Usuario desactivado exitosamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/roles
 */
const getRoles = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM roles ORDER BY id');
    return successResponse(res, result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser, getRoles };
