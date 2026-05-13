// 建立站點瀏覽計數表（執行於 coupon DB）
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  connectionString:
    'postgresql://nuxt-marketing_owner:ys7ZNVhOrg9c@ep-rough-voice-a1ele0z6-pooler.ap-southeast-1.aws.neon.tech/nuxt-marketing?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false },
})

async function run() {
  console.log('🚀 建立 site_pageview 表...')

  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'create-site-pageview-table.sql'),
      'utf8'
    )

    const client = await pool.connect()
    try {
      console.log('📡 已連接 coupon DB')
      await client.query(sql)
      console.log('✅ SQL 執行成功')

      const result = await client.query(
        'SELECT id, count, updated_at FROM site_pageview WHERE id = 1'
      )
      if (result.rows.length > 0) {
        const { count, updated_at } = result.rows[0]
        console.log(`📈 目前計數: ${count}`)
        console.log(`🕐 最後更新: ${updated_at}`)
      } else {
        console.log('⚠️ 找不到計數列，請確認 SQL 是否正常執行')
      }
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('❌ 遷移失敗:', err)
    process.exit(1)
  } finally {
    await pool.end()
    console.log('🔌 連線已關閉')
  }
}

run()
  .then(() => {
    console.log('🎉 完成')
    process.exit(0)
  })
  .catch((err) => {
    console.error('💥 例外:', err)
    process.exit(1)
  })
