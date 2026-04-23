require('dotenv').config();
const { query } = require('./src/config/database');

async function checkUsers() {
  try {
    const res = await query('SELECT id, name, username, email FROM users');
    console.log('Usuarios en BD:');
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUsers(); 