const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:aeOSPRFqtrQVMqbpIvdaVhKoGgeKrzUR@nozomi.proxy.rlwy.net:18072/railway",
  ssl: { rejectUnauthorized: false }
});

async function verifyRoles() {
  try {
    const res = await pool.query("SELECT * FROM roles");
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

verifyRoles();
