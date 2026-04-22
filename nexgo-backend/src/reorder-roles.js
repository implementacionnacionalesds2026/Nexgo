require('dotenv').config();
const { query } = require('./config/database');

async function reorderRoles() {
  try {
    console.log('Reordering roles and updating users...');

    // 1. Rename to temp names to avoid unique constraint on 'name'
    await query("UPDATE roles SET name = 'TEMP_2' WHERE id = 2");
    await query("UPDATE roles SET name = 'TEMP_3' WHERE id = 3");
    await query("UPDATE roles SET name = 'TEMP_4' WHERE id = 4");
    await query("UPDATE roles SET name = 'TEMP_5' WHERE id = 5");

    // 2. Create a temp role to avoid FK issues when moving users
    await query("INSERT INTO roles (id, name, description) VALUES (999, 'TEMP_ROLE', 'Temp')");
    
    // 3. Swap user role assignments
    // Move users with ID 3 (was Repartidor) to temp
    await query("UPDATE users SET role_id = 999 WHERE role_id = 3");
    // Move users with ID 5 (was Average/Plata) to 3
    await query("UPDATE users SET role_id = 3 WHERE role_id = 5");
    // Move users with ID 999 (was Repartidor) to 5
    await query("UPDATE users SET role_id = 5 WHERE role_id = 999");

    // 4. Update the roles table with final names and descriptions
    await query("UPDATE roles SET name = 'SMALL_CUSTOMER', description = 'Cliente Bronce' WHERE id = 2");
    await query("UPDATE roles SET name = 'AVERAGE_CUSTOMER', description = 'Cliente Plata' WHERE id = 3");
    await query("UPDATE roles SET name = 'FULL_CUSTOMER', description = 'Cliente Oro' WHERE id = 4");
    await query("UPDATE roles SET name = 'REPARTIDOR', description = 'Repartidor' WHERE id = 5");
    
    // 5. Clean up
    await query("DELETE FROM roles WHERE id = 999");

    const res = await query("SELECT * FROM roles ORDER BY id");
    console.log('Roles reordered successfully:', res.rows);

  } catch (err) {
    console.error('Reorder failed:', err);
  } finally {
    process.exit();
  }
}

reorderRoles();
