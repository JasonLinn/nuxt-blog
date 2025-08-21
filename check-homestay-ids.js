import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkHomestayIds() {
  try {
    console.log('=== 檢查現有的民宿 ID ===');
    const result = await pool.query('SELECT id, name FROM homestays ORDER BY id');
    console.log('現有民宿:');
    result.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Name: ${row.name}`);
    });

    console.log('\n=== 檢查是否有 ID 包含 070 的民宿 ===');
    const result2 = await pool.query(`SELECT id, name FROM homestays WHERE id LIKE '%070%' OR id = '070'`);
    console.log('包含 070 的民宿:');
    console.log(result2.rows);

  } catch (error) {
    console.error('錯誤:', error.message);
  } finally {
    await pool.end();
  }
}

checkHomestayIds();
