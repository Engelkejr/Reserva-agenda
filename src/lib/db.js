import { Pool } from 'pg';

let pool;

if (!pool) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Supabase requires SSL
  });
}

export const initDb = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      name TEXT NOT NULL,
      sector TEXT NOT NULL,
      contact TEXT NOT NULL,
      email TEXT NOT NULL,
      token TEXT NOT NULL,
      isConfirmed INTEGER DEFAULT 0
    );
  `;
  try {
    await pool.query(createTableQuery);
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

export const query = async (text, params = []) => {
  // Convert sqlite ? placeholders to postgres $1, $2 placeholders
  let pgText = text;
  params.forEach((_, i) => {
    pgText = pgText.replace('?', `$${i + 1}`);
  });
  
  const { rows } = await pool.query(pgText, params);
  return rows;
};

export const run = async (text, params = []) => {
  let pgText = text;
  params.forEach((_, i) => {
    pgText = pgText.replace('?', `$${i + 1}`);
  });
  
  await pool.query(pgText, params);
};

// Initialize DB schema
initDb();
