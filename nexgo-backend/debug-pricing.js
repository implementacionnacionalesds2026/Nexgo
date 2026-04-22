require('dotenv').config();
const { query } = require('./src/config/database');

async function debugPricing() {
  try {
    const rules = await query('SELECT * FROM pricing_rules');
    console.log('RULES IN DB:', JSON.stringify(rules.rows, null, 2));
    
    const users = await query('SELECT id, name, role_id, username FROM users');
    console.log('USERS IN DB:', JSON.stringify(users.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

debugPricing();
