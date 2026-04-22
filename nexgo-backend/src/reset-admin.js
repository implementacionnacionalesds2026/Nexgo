require('dotenv').config();
const { query } = require('./config/database');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    await query("UPDATE users SET password_hash = $1 WHERE email = 'admin@nexgo.gt'", [hash]);
    console.log('Admin password reset to admin123');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
resetAdmin();
