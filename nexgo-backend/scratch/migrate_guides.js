require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('Adding available_guides to pricing_rules...');
    await pool.query(`
      ALTER TABLE pricing_rules 
      ADD COLUMN IF NOT EXISTS available_guides INTEGER DEFAULT 0;
    `);

    console.log('Creating guide_inventory_logs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guide_inventory_logs (
        id SERIAL PRIMARY KEY,
        pricing_rule_id INTEGER REFERENCES pricing_rules(id) ON DELETE CASCADE,
        admin_id UUID REFERENCES users(id),
        previous_balance INTEGER NOT NULL,
        added_amount INTEGER NOT NULL,
        new_balance INTEGER NOT NULL,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Migration complete.');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await pool.end();
  }
}

migrate();
