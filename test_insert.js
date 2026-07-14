const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Joao0510Brunna.%40%40%21@db.rvgvvxyyssxuaidoeoer.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

client.connect().then(async () => {
  const id = 'test-id';
  const date = '2026-07-20';
  const startTime = '14:00';
  const endTime = '15:00';
  const name = 'Test';
  const sector = 'TI';
  const contact = '123';
  const email = 'test@test.com';
  const token = 'tok';

  try {
    await client.query(
      'INSERT INTO bookings (id, date, startTime, endTime, name, sector, contact, email, token, isConfirmed) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)',
      [id, date, startTime, endTime, name, sector, contact, email, token]
    );
    console.log('Inserted!');
  } catch (e) {
    console.error('Insert failed:', e);
  }
}).catch(console.error).finally(() => {
  client.end();
});
