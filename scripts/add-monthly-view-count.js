import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addMonthlyViewCount() {
  try {
    console.log('Adding view_count_monthly column to article table...');
    await pool.query('ALTER TABLE article ADD COLUMN IF NOT EXISTS view_count_monthly INTEGER DEFAULT 0;');
    await pool.query('UPDATE article SET view_count_monthly = view_count WHERE view_count_monthly IS NULL OR view_count_monthly = 0;');
    console.log('Successfully added and initialized view_count_monthly column.');
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    await pool.end();
  }
}

addMonthlyViewCount();
