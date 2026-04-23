require('dotenv').config();

const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5433),
  database: process.env.DB_NAME || 'nexgo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD) : 'Manager1',
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