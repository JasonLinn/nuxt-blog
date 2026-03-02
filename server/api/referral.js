import { readBody, createError } from '#imports'
import { pool } from '../utils/db.js'

export default defineEventHandler(async (event) => {
  try {
    // 讀取請求體
    const body = await readBody(event);

    // 驗證請求體中是否包含 code
    if (!body || !body.code) {
      throw createError({
        statusCode: 400,
        message: "缺少推薦代碼"
      });
    }

    const { code } = body;

    // 從資料庫查詢推薦代碼
    const result = await pool.query('SELECT code, name FROM referrals WHERE code = $1', [code]);
    const referralData = result.rows[0];

    if (!referralData) {
      throw createError({
        statusCode: 404,
        message: "無效的推薦代碼"
      });
    }

    return {
      success: true,
      data: referralData
    };

  } catch (error) {
    console.error('推薦代碼驗證錯誤:', error);

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "服務器錯誤，請稍後再試"
    });
  }
});