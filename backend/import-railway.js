const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importDb() {
  console.log('Conectando a Railway MySQL...');
  const conn = await mysql.createConnection({
    host: 'thomas.proxy.rlwy.net',
    port: 47961,
    user: 'root',
    password: 'APZaawPmZuQgOfeJdnTXsRhqFqGCvxlS',
    database: 'railway',
    multipleStatements: true
  });
  console.log('✅ Conectado!');

  const sql = fs.readFileSync(path.join(__dirname, '../database/produccion.sql'), 'utf8');
  console.log('Importando esquema...');
  await conn.execute(sql);
  console.log('✅ Importación completada!');

  const [tables] = await conn.execute('SHOW TABLES');
  console.log(`📋 Tablas creadas: ${tables.length}`);
  tables.forEach(t => console.log('  -', Object.values(t)[0]));

  await conn.end();
}

importDb().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
