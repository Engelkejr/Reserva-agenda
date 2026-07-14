const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Joao0510Brunna.%40%40%21@db.rvgvvxyyssxuaidoeoer.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

client.connect().then(() => {
  return client.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';");
}).then(r => {
  console.log('Tables:', r.rows);
}).catch(console.error).finally(() => {
  client.end();
});
