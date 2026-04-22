require('dotenv').config();
const { query } = require('./config/database');

async function cleanupAndFinish() {
  try {
    console.log('Cleaning up and finishing migration...');

    // 1. Move users from temp role (999) back if any
    // Wait, let's see who is in 999
    const users999 = await query("SELECT count(*) FROM users WHERE role_id = 999");
    console.log('Users in 999:', users999.rows[0].count);

    // From previous run, users were moved like this:
    // 3 (was Repartidor) -> moved to 999
    // 5 (was Average/Plata) -> moved to 3
    // Then it failed before moving 999 to 5.

    // So currently:
    // users with old Repartidor role are in 999.
    // users with old Average role are in 3.

    // Move 999 (Repartidors) to 5
    await query("UPDATE users SET role_id = 5 WHERE role_id = 999");
    
    // 2. Delete the temp roles
    await query("DELETE FROM roles WHERE id = 999");
    // await query("DELETE FROM roles WHERE id = 1000"); // Just in case

    // 3. Final rename of roles
    await query("UPDATE roles SET name = 'SMALL_CUSTOMER', description = 'Cliente Bronce' WHERE id = 2");
    await query("UPDATE roles SET name = 'AVERAGE_CUSTOMER', description = 'Cliente Plata' WHERE id = 3");
    await query("UPDATE roles SET name = 'FULL_CUSTOMER', description = 'Cliente Oro' WHERE id = 4");
    await query("UPDATE roles SET name = 'REPARTIDOR', description = 'Repartidor' WHERE id = 5");
    
    await query("UPDATE roles SET description = 'Administrador' WHERE id = 1");

    const res = await query("SELECT * FROM roles ORDER BY id");
    console.log('Final roles:', res.rows);

  } catch (err) {
    console.error('Failed:', err);
  } finally {
    process.exit();
  }
}

cleanupAndFinish();
