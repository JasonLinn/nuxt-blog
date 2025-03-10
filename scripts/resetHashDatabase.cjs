const { Pool } = require('pg');
const dotenv = require('dotenv');

// 加載環境變量
dotenv.config();

async function resetHashDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('開始重置數據庫...');
    
    // 清空表
    await pool.query('TRUNCATE TABLE available_hash CASCADE');
    await pool.query('TRUNCATE TABLE used_hash CASCADE');
    
    console.log('數據庫重置完成');
    
    pool.end();
  } catch (error) {
    console.error('重置失敗:', error);
    pool.end();
    process.exit(1);
  }
}

resetHashDatabase(); 