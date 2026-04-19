const { query } = require('./src/config/database');
require('dotenv').config();

const checkColumns = async () => {
  try {
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'shipments'
      ORDER BY ordinal_position;
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
};

checkColumns();
