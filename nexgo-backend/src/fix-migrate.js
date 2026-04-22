require('dotenv').config();
const { query } = require('./config/database');

async function fixSequenceAndMigrate() {
  try {
    console.log('Fixing sequence and adding roles...');

    // Fix sequence
    await query("SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles))");
    console.log('Sequence fixed.');

    // Add FULL_CUSTOMER
    const fullRes = await query("SELECT id FROM roles WHERE name = 'FULL_CUSTOMER'");
    if (fullRes.rows.length === 0) {
      await query(
        "INSERT INTO roles (name, description) VALUES ('FULL_CUSTOMER', 'Cliente con tarifas fijas negociadas')"
      );
      console.log('Added FULL_CUSTOMER role');
    }

    // Add AVERAGE_CUSTOMER
    const avgRes = await query("SELECT id FROM roles WHERE name = 'AVERAGE_CUSTOMER'");
    if (avgRes.rows.length === 0) {
      await query(
        "INSERT INTO roles (name, description) VALUES ('AVERAGE_CUSTOMER', 'Cliente con cotizador y tarifas')"
      );
      console.log('Added AVERAGE_CUSTOMER role');
    }

    const finalRoles = await query('SELECT * FROM roles ORDER BY id');
    console.log('Final Roles:', finalRoles.rows);

  } catch (err) {
    console.error('Operation failed:', err);
  } finally {
    process.exit();
  }
}

fixSequenceAndMigrate();
