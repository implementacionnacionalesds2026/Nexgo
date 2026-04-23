const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:aeOSPRFqtrQVMqbpIvdaVhKoGgeKrzUR@nozomi.proxy.rlwy.net:18072/railway",
  ssl: { rejectUnauthorized: false }
});

async function getPricingRulesSchema() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pricing_rules'
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

getPricingRulesSchema();
