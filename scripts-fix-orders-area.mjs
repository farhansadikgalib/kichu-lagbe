import { Pool } from 'pg';
const u = new URL(process.env.DATABASE_URL); u.searchParams.delete('sslmode');
const pool = new Pool({ connectionString: u.toString(), ssl: { rejectUnauthorized: false } });
await pool.query('ALTER TABLE orders ALTER COLUMN area_id DROP NOT NULL');
await pool.query('ALTER TABLE orders ALTER COLUMN area_name DROP NOT NULL');
console.log('done'); await pool.end();
