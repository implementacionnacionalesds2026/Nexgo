const bcrypt     = require('bcryptjs');
const { query }  = require('../config/database');
const { generateToken } = require('../config/jwt');
const logger     = require('../utils/logger');

/**
 * Login de usuario
 * @param {string} username
 * @param {string} password
 */
const login = async (loginId, password) => {
  const result = await query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.is_active,
            u.first_name, u.last_name, u.username,
            r.name AS role, u.company_name, u.phone
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE LOWER(u.username) = $1 OR LOWER(u.email) = $1`,
    [loginId.toLowerCase().trim()]
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
    username: user.username,
  };

  const token = generateToken(tokenPayload);

  logger.info(`Login exitoso: ${user.email} (${user.role})`);

  return {
    token,
    user: {
      id:          user.id,
      name:        user.name,
      firstName:   user.first_name,
      lastName:    user.last_name,
      username:    user.username,
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
const register = async ({ firstName, lastName, email, password, roleId, phone, companyName }) => {
  // Verificar si el email ya existe
  const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    throw Object.assign(new Error('El email ya está registrado'), { statusCode: 409 });
  }

  // Generar nombre completo para compatibilidad
  const name = `${firstName} ${lastName}`;
  // Generar nombre de usuario automático: nombre.apellido
  const username = `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase().replace(/\s+/g, '')}`;

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await query(
    `INSERT INTO users (role_id, name, first_name, last_name, username, email, password_hash, phone, company_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, name, first_name, last_name, username, email, phone, company_name, created_at`,
    [roleId, name.trim(), firstName.trim(), lastName.trim(), username, email.toLowerCase().trim(), passwordHash, phone, companyName]
  );

  logger.info(`Nuevo usuario registrado: ${email} (username: ${username})`);
  return result.rows[0];
};

/**
 * Obtener perfil del usuario actual
 */
const getProfile = async (userId) => {
  const result = await query(
    `SELECT u.id, u.name, u.first_name, u.last_name, u.username, u.email, u.phone, u.company_name, u.is_active, u.created_at,
            r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [userId]
  );

  if (!result.rows[0]) {
    throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
  }

  const user = result.rows[0];
  return {
    ...user,
    firstName: user.first_name,
    lastName:  user.last_name,
  };
};

module.exports = { login, register, getProfile };
