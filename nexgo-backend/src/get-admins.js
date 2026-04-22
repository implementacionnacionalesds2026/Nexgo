require('dotenv').config();
const { query } = require('./config/database');

async function getAdmins() {
  try {
    const res = await query("SELECT email FROM users JOIN roles ON roles.id = users.role_id WHERE roles.name = 'ADMIN'");
    console.log('Admin emails:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
getAdmins();
