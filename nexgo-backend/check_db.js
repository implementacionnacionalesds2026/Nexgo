const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugData() {
  try {
    console.log('--- USERS ---');
    const users = await pool.query('SELECT id, name, company_name FROM users LIMIT 10');
    console.table(users.rows);

    console.log('--- PRICING RULES ---');
    const rules = await pool.query('SELECT id, name, user_id, role_id FROM pricing_rules');
    console.table(rules.rows);

    console.log('--- RECENT LOGS ---');
    const logs = await pool.query('SELECT id, pricing_rule_id, admin_id, added_amount, created_at FROM guide_inventory_logs ORDER BY created_at DESC LIMIT 10');
    console.table(logs.rows);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debugData();
