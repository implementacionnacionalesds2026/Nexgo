require('dotenv').config();
const { query } = require('./config/database');

async function migrateRoles() {
  try {
    console.log('Starting role migration...');

    // 1. Rename CLIENTE to SMALL_CUSTOMER
    const renameRes = await query(
      "UPDATE roles SET name = 'SMALL_CUSTOMER', description = 'Cliente pequeño' WHERE name = 'CLIENTE' RETURNING *"
    );
    if (renameRes.rows.length > 0) {
      console.log('Renamed CLIENTE to SMALL_CUSTOMER');
    } else {
      console.log('CLIENTE role not found or already renamed.');
    }

    // 2. Add FULL_CUSTOMER if not exists
    const fullRes = await query("SELECT id FROM roles WHERE name = 'FULL_CUSTOMER'");
    if (fullRes.rows.length === 0) {
      await query(
        "INSERT INTO roles (name, description) VALUES ('FULL_CUSTOMER', 'Cliente con tarifas fijas negociadas')"
      );
      console.log('Added FULL_CUSTOMER role');
    }

    // 3. Add AVERAGE_CUSTOMER if not exists
    const avgRes = await query("SELECT id FROM roles WHERE name = 'AVERAGE_CUSTOMER'");
    if (avgRes.rows.length === 0) {
      await query(
        "INSERT INTO roles (name, description) VALUES ('AVERAGE_CUSTOMER', 'Cliente con cotizador y tarifas')"
      );
      console.log('Added AVERAGE_CUSTOMER role');
    }

    const finalRoles = await query('SELECT * FROM roles ORDER BY id');
    console.log('Migration complete. Current Roles:', finalRoles.rows);

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrateRoles();
