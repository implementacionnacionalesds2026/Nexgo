const bcrypt     = require('bcryptjs');
const { query }  = require('../config/database');
const { generateToken } = require('../config/jwt');
const logger     = require('../utils/logger');

/**
 * Login de usuario
 * @param {string} email
 * @param {string} password
 */
const login = async (email, password) => {
  const result = await query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.is_active,
            r.name AS role, u.company_name, u.phone
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = $1`,
    [email.toLowerCase().trim()]
  );

  const user = result.rows[0];

  if (!user) {
    throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
  }

  if (!user.is_active) {
    throw Object.assign(new Error('Cuenta desactivada. Contacta al administrador.'), { statusCode: 403 });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 });
  }

  const tokenPayload = {
    id:       user.id,
    email:    user.email,
    role:     user.role,
    name:     user.name,
  };

  const token = generateToken(tokenPayload);

  logger.info(`Login exitoso: ${user.email} (${user.role})`);

  return {
    token,
    user: {
      id:          user.id,
      name:        user.name,
      email:       user.email,
      role:        user.role,
      companyName: user.company_name,
      phone:       user.phone,
    },
  };
};

/**
 * Registro de nuevo usuario (solo ADMIN puede crear usuarios)
 */
const register = async ({ name, email, password, roleId, phone, companyName }) => {
  // Verificar si el email ya existe
  const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    throw Object.assign(new Error('El email ya está registrado'), { statusCode: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await query(
    `INSERT INTO users (role_id, name, email, password_hash, phone, company_name)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, phone, company_name, created_at`,
    [roleId, name.trim(), email.toLowerCase().trim(), passwordHash, phone, companyName]
  );

  logger.info(`Nuevo usuario registrado: ${email}`);
  return result.rows[0];
};

/**
 * Obtener perfil del usuario actual
 */
const getProfile = async (userId) => {
  const result = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.company_name, u.is_active, u.created_at,
            r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [userId]
  );

  if (!result.rows[0]) {
    throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  }

  return result.rows[0];
};

module.exports = { login, register, getProfile };
