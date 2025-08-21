import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAvailabilityData() {
  try {
    console.log('=== 檢查 homestay_availability 表格中的 070 資料 ===');
    const result1 = await pool.query(`
      SELECT date, is_available, is_booked, weekday_price, weekend_price 
      FROM homestay_availability 
      WHERE homestay_id = '070' 
      ORDER BY date LIMIT 10
    `);
    console.log('homestay_availability 中 070 的資料:');
    console.log(result1.rows);

    console.log('\n=== 檢查 homestay_booking_status 表格中的 070 資料 ===');
    const result2 = await pool.query(`
      SELECT homestay_id, default_available, availability_data 
      FROM homestay_booking_status 
      WHERE homestay_id = '070'
    `);
    console.log('homestay_booking_status 中 070 的資料:');
    console.log(result2.rows);

    console.log('\n=== 檢查資料筆數差異 ===');
    const count1 = await pool.query(`SELECT COUNT(*) FROM homestay_availability WHERE homestay_id = '070'`);
    const count2 = await pool.query(`SELECT COUNT(*) FROM homestay_booking_status WHERE homestay_id = '070'`);
    console.log(`homestay_availability 中 070 的資料筆數: ${count1.rows[0].count}`);
    console.log(`homestay_booking_status 中 070 的資料筆數: ${count2.rows[0].count}`);

  } catch (error) {
    console.error('錯誤:', error.message);
  } finally {
    await pool.end();
  }
}

checkAvailabilityData();
