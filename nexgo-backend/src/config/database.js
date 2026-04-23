const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  logger.info('Nueva conexión establecida con PostgreSQL');
});

pool.on('error', (err) => {
  logger.error('Error inesperado en cliente PostgreSQL', err);
});

/**
 * Ejecuta una query con parámetros
 * @param {string} text - SQL query
 * @param {Array} params - Parámetros
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Query ejecutada', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Error en query', { text, error: error.message });
    throw error;
  }
};

/**
 * Verifica la conexión a la base de datos
 */
const testConnection = async () => {
  try {
    const res = await query('SELECT NOW() as current_time');
    logger.info(`✅ Base de datos conectada: ${res.rows[0].current_time}`);
    return true;
  } catch (error) {
    logger.error('❌ Error conectando a la base de datos:', error.message);
    return false;
  }
};

module.exports = { query, pool, testConnection };
