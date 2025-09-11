// 前台用戶提交地點推薦（需要審核）
import { pool } from '../../utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // 驗證必填欄位
    if (!body.name || !body.latitude || !body.longitude || !body.category_id) {
      return {
        success: false,
        message: '請填寫必填欄位：地點名稱、經緯度、分類'
      };
    }

    const client = await pool.connect();
    
    try {
      // 插入新地點，狀態設為 pending（待審核）
      const insertQuery = `
        INSERT INTO places (
          name, 
          description, 
          category_id,
          formatted_address,
          latitude,
          longitude,
          phone_number,
          website,
          google_place_id,
          photos,
          status,
          is_featured,
          is_private,
          submitted_by,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
        RETURNING id, name, status
      `;
      
      const values = [
        body.name,
        body.description || null,
        parseInt(body.category_id),
        body.formatted_address || null,
        parseFloat(body.latitude),
        parseFloat(body.longitude),
        body.phone_number || null,
        body.website || null,
        body.google_place_id || null,
        body.photos ? JSON.stringify(body.photos) : null,
        'pending', // 狀態設為待審核
        false, // 不是精選
        false, // 不是私房景點
        body.submitted_by || 'anonymous' // 提交者
      ];
      
      const result = await client.query(insertQuery, values);
      
      if (result.rows.length > 0) {
        const newPlace = result.rows[0];
        
        console.log('新地點提交成功:', {
          id: newPlace.id,
          name: newPlace.name,
          status: newPlace.status,
          submittedBy: body.submitted_by || 'anonymous'
        });
        
        return {
          success: true,
          message: '地點推薦提交成功，將在管理員審核通過後顯示',
          data: {
            id: newPlace.id,
            name: newPlace.name,
            status: newPlace.status
          }
        };
      } else {
        throw new Error('插入地點失敗');
      }
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('提交地點推薦失敗:', error);
    
    // 處理特定錯誤
    if (error.message.includes('duplicate key')) {
      return {
        success: false,
        message: '此地點可能已經存在'
      };
    }
    
    if (error.message.includes('foreign key')) {
      return {
        success: false,
        message: '選擇的分類不存在'
      };
    }
    
    return {
      success: false,
      message: '提交失敗，請稍後重試',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
});
