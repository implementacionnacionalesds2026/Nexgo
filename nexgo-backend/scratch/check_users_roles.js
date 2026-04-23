const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:aeOSPRFqtrQVMqbpIvdaVhKoGgeKrzUR@nozomi.proxy.rlwy.net:18072/railway",
  ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
  try {
    console.log('Checking users and their role IDs...');
    const res = await pool.query(`
      SELECT u.id, u.username, u.name, u.role_id, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkUsers();
