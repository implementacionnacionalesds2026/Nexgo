require('dotenv').config();
const { query } = require('./config/database');

async function checkRoles() {
  try {
    const res = await query('SELECT * FROM roles');
    console.log('Current Roles:', res.rows);
    
    const usersRes = await query('SELECT r.name, COUNT(u.id) FROM users u JOIN roles r ON r.id = u.role_id GROUP BY r.name');
    console.log('User counts per role:', usersRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
checkRoles();
