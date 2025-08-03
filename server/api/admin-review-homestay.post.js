import jwt from 'jsonwebtoken';
import { sendApprovalEmail, sendRejectionEmail } from '../utils/emailService.js';
import { pool } from '../utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    // 驗證管理員身份
    const accessToken = getCookie(event, 'admin_access_token');
    
    if (!accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: '未登入'
      });
    }

    const decoded = jwt.verify(accessToken, 'JWT_SIGN_SECRET_ADMIN_2024');
    
    if (!decoded.data || decoded.data.type !== 'admin') {
      throw createError({
        statusCode: 401,
        statusMessage: '無權限訪問'
      });
    }

    const body = await readBody(event);
    const { homestayId, action, rejectionReason } = body;

    // 驗證必要參數
    if (!homestayId || !action) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必要參數'
      });
    }

    if (!['approve', 'reject'].includes(action)) {
      throw createError({
        statusCode: 400,
        statusMessage: '無效的審核動作'
      });
    }

    if (action === 'reject' && !rejectionReason) {
      throw createError({
        statusCode: 400,
        statusMessage: '拒絕申請時必須提供拒絕原因'
      });
    }

    // 開始交易
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 檢查民宿是否存在且處於待審核狀態
      const checkQuery = 'SELECT id, name, email, status FROM homestays WHERE id = $1';
      const checkResult = await client.query(checkQuery, [homestayId]);
      
      if (checkResult.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: '找不到指定的民宿'
        });
      }

      const homestay = checkResult.rows[0];
      
      if (homestay.status !== 'pending') {
        throw createError({
          statusCode: 400,
          statusMessage: `此民宿已被審核，目前狀態為：${homestay.status}`
        });
      }

      // 執行審核動作
      let updateQuery;
      let updateParams;

      if (action === 'approve') {
        updateQuery = `
          UPDATE homestays 
          SET 
            status = 'approved',
            available = true,
            approved_at = CURRENT_TIMESTAMP,
            approved_by = $1,
            rejection_reason = NULL
          WHERE id = $2
          RETURNING id, name, status
        `;
        updateParams = [decoded.data.username, homestayId];
      } else {
        updateQuery = `
          UPDATE homestays 
          SET 
            status = 'rejected',
            available = false,
            approved_at = CURRENT_TIMESTAMP,
            approved_by = $1,
            rejection_reason = $2
          WHERE id = $3
          RETURNING id, name, status
        `;
        updateParams = [decoded.data.username, rejectionReason, homestayId];
      }

      const updateResult = await client.query(updateQuery, updateParams);
      
      if (updateResult.rows.length === 0) {
        throw createError({
          statusCode: 500,
          statusMessage: '審核更新失敗'
        });
      }

      const updatedHomestay = updateResult.rows[0];

      // 記錄審核日誌
      const actionText = action === 'approve' ? '批准' : '拒絕';
      console.log(`民宿審核: ${actionText} ID=${homestayId}, 名稱=${homestay.name}, 審核者=${decoded.data.username}, 時間=${new Date().toISOString()}`);
      
      if (action === 'reject') {
        console.log(`拒絕原因: ${rejectionReason}`);
      }

      // 提交交易
      await client.query('COMMIT');

      // 發送審核結果通知信件
      try {
        if (action === 'approve') {
          await sendApprovalEmail(homestay.email, homestay.name, homestayId);
          console.log(`審核通過郵件已發送至: ${homestay.email}`);
        } else {
          await sendRejectionEmail(homestay.email, homestay.name, homestayId, rejectionReason);
          console.log(`審核拒絕郵件已發送至: ${homestay.email}`);
        }
      } catch (emailError) {
        // 郵件發送失敗不影響審核流程，但要記錄錯誤
        console.error('郵件發送失敗:', emailError);
        console.error(`無法發送郵件至 ${homestay.email}，審核結果已保存但通知未發送`);
      }

      return {
        success: true,
        message: `民宿申請已${actionText}`,
        data: {
          id: updatedHomestay.id,
          name: updatedHomestay.name,
          status: updatedHomestay.status,
          action: action,
          approved_by: decoded.data.username,
          approved_at: new Date().toISOString(),
          rejection_reason: action === 'reject' ? rejectionReason : null
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('審核民宿錯誤:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '審核系統發生錯誤，請稍後重試'
    });
  }
}); 