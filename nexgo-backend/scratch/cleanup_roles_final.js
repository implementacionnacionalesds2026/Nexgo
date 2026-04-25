require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cleanupRoles() {
  try {
    console.log('Cleaning up roles...');
    // Eliminar roles duplicados o con nombres feos
    await pool.query("DELETE FROM roles WHERE id IN (6, 7)");
    
    // Crear un único rol limpio
    const res = await pool.query(
      "INSERT INTO roles (id, name, description) VALUES (6, 'GESTOR_ADMINISTRATIVO', 'Gestor Administrativo') RETURNING *"
    );
    console.log('Role recreated:', res.rows[0]);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

cleanupRoles();
