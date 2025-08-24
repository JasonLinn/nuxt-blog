const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_DSt86GUynwli@ep-fancy-snow-a8232ddc-pooler.eastus2.azure.neon.tech/neondb?sslmode=require';

async function testApi() {
  const client = new Client({
    connectionString: connectionString
  });

  try {
    await client.connect();
    console.log('🔍 測試 API 查詢...');
    
    // 模擬 API 端點的查詢
    const id = 1;
    const result = await client.query(`
      SELECT 
        id,
        title,
        description,
        images,
        event_date,
        event_time,
        location,
        activity_type,
        organizer_name,
        organizer_email,
        organizer_phone,
        contact_info,
        status,
        rejection_reason,
        submitter_name,
        submitter_email,
        admin_notes,
        created_at,
        updated_at,
        approved_at,
        approved_by,
        end_date,
        end_time,
        is_multi_day,
        organizer_contact
      FROM yilan_activities 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      console.log('❌ 找不到記錄');
      return;
    }
    
    console.log('✅ API 查詢成功');
    console.log('📋 完整記錄數據:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
    // 模擬 API 回應格式
    const apiResponse = {
      success: true,
      data: result.rows[0],
      message: '查詢成功'
    };
    
    console.log('\n🔗 模擬 API 回應:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  } finally {
    await client.end();
  }
}

testApi();
