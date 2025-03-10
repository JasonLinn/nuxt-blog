const { Pool } = require('pg');
const dotenv = require('dotenv');

// 加載環境變量
dotenv.config();

async function checkHashCount() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const result = await pool.query('SELECT COUNT(*) FROM available_hash');
    console.log('可用 hash 數量:', result.rows[0].count);
    
    const usedResult = await pool.query('SELECT COUNT(*) FROM used_hash');
    console.log('已使用 hash 數量:', usedResult.rows[0].count);
    
    pool.end();
  } catch (error) {
    console.error('查詢失敗:', error);
    pool.end();
    process.exit(1);
  }
}

checkHashCount(); 