require('dotenv').config();
const { query } = require('../src/config/database');

async function fix() {
  console.log('Verificando tablas en la base de datos...');
  try {
    // 1. Crear tabla guide_inventory_logs si no existe
    await query(`
      CREATE TABLE IF NOT EXISTS guide_inventory_logs (
        id SERIAL PRIMARY KEY,
        pricing_rule_id INTEGER REFERENCES pricing_rules(id) ON DELETE CASCADE,
        admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
        previous_balance INTEGER DEFAULT 0,
        added_amount INTEGER NOT NULL,
        new_balance INTEGER NOT NULL,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla guide_inventory_logs verificada/creada.');

    // 2. Verificar columnas en pricing_rules
    const columnsRes = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pricing_rules'
    `);
    const columns = columnsRes.rows.map(c => c.column_name);
    
    if (!columns.includes('available_guides')) {
      await query('ALTER TABLE pricing_rules ADD COLUMN available_guides INTEGER DEFAULT 0');
      console.log('✅ Columna available_guides añadida a pricing_rules.');
    } else {
      console.log('✅ Columna available_guides ya existe en pricing_rules.');
    }

  } catch (err) {
    console.error('❌ Error ejecutando fix:', err);
  } finally {
    process.exit();
  }
}

fix();
