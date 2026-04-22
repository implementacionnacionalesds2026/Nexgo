require('dotenv').config();
const { query } = require('./config/database');

async function findUser() {
  try {
    const res = await query("SELECT u.*, r.name as role_name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.username = 'yeyson.barillas' OR u.email = 'yeyson.barillas'");
    console.log('User found:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
findUser();
