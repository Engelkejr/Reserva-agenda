const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Joao0510Brunna.%40%40%21@db.rvgvvxyyssxuaidoeoer.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

client.connect().then(async () => {
  try {
    await client.query('ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;');
    console.log('RLS disabled!');
  } catch (e) {
    console.error('Failed:', e);
  }
}).catch(console.error).finally(() => {
  client.end();
});
