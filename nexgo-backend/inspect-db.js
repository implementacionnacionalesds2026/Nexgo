const { query } = require('./src/config/database');
require('dotenv').config();

const inspect = async () => {
  try {
    console.log('--- USERS TABLE ---');
    const users = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    console.table(users.rows);

    console.log('--- SHIPMENT_STATUS TABLE ---');
    const status = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'shipment_status'");
    console.table(status.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

inspect();
