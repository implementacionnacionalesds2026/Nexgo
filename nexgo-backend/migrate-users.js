const { query } = require('./src/config/database');
require('dotenv').config();

const migrate = async () => {
  try {
    console.log('--- ADDING COLUMNS ---');
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS first_name VARCHAR(50), 
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(50), 
      ADD COLUMN IF NOT EXISTS username VARCHAR(105) UNIQUE;
    `);

    console.log('--- FETCHING EXISTING USERS ---');
    const result = await query("SELECT id, name FROM users");
    
    for (const user of result.rows) {
      if (!user.name) continue;
      
      const parts = user.name.trim().split(/\s+/);
      const firstName = parts[0] || 'User';
      const lastName = parts.slice(1).join(' ') || 'Unknown';
      const username = `${firstName.toLowerCase()}.${parts[1] ? parts[1].toLowerCase() : 'user'}`;
      
      console.log(`Migrating: ${user.name} -> ${firstName} | ${lastName} | ${username}`);
      
      await query(
        "UPDATE users SET first_name = $1, last_name = $2, username = $3 WHERE id = $4",
        [firstName, lastName, username, user.id]
      );
    }

    console.log('--- DONE ---');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
