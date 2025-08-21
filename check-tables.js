import pkg from 'pg';
const { Pool } = pkg;

async function checkTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('=== 檢查 homestay_availability 表格 ===');
    const result1 = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'homestay_availability' 
      ORDER BY ordinal_position
    `);
    console.log('homestay_availability 欄位:', result1.rows);
    
    console.log('\n=== 檢查 homestay_booking_status 表格 ===');
    const result2 = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'homestay_booking_status' 
      ORDER BY ordinal_position
    `);
    console.log('homestay_booking_status 欄位:', result2.rows);
    
    console.log('\n=== 檢查兩個表格的資料筆數 ===');
    const count1 = await pool.query('SELECT COUNT(*) FROM homestay_availability');
    const count2 = await pool.query('SELECT COUNT(*) FROM homestay_booking_status');
    console.log('homestay_availability 資料筆數:', count1.rows[0].count);
    console.log('homestay_booking_status 資料筆數:', count2.rows[0].count);
    
    console.log('\n=== 檢查 homestay_booking_status 中的示例資料 ===');
    const sample = await pool.query('SELECT homestay_id, default_available, availability_data FROM homestay_booking_status LIMIT 3');
    console.log('homestay_booking_status 示例資料:', sample.rows);
    
  } catch (error) {
    console.error('錯誤:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
