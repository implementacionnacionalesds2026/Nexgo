require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupGestorRole() {
  try {
    console.log('Checking roles...');
    const res = await pool.query('SELECT * FROM roles');
    console.log('Current roles:', res.rows);

    const gestorExists = res.rows.find(r => r.name === 'GESTOR_ADMINISTRATIVO');
    
    if (!gestorExists) {
      console.log('Creating GESTOR_ADMINISTRATIVO role...');
      const insertRes = await pool.query(
        "INSERT INTO roles (name, description) VALUES ('GESTOR_ADMINISTRATIVO', 'Gestor administrativo con acceso a operaciones y administración de tarifas') RETURNING *"
      );
      console.log('Role created:', insertRes.rows[0]);
    } else {
      console.log('GESTOR_ADMINISTRATIVO role already exists.');
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

setupGestorRole();
