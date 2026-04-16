const { Pool } = require('pg');
const logger = require('../utils/logger');

// Supabase: el host directo es solo IPv6, usamos el pooler IPv4
const poolConfig = {
  host:     process.env.PGHOST     || 'aws-0-us-east-1.pooler.supabase.com',
  port:     parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'postgres',
  user:     process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
};

const pool = new Pool(poolConfig);

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
