import jwt from 'jsonwebtoken';
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

    // 取得查詢參數
    const query = getQuery(event);
    const status = query.status || 'pending'; // pending, approved, rejected, all
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    // 建構查詢條件
    let whereCondition = '';
    let params = [];
    let paramIndex = 1;

    if (status !== 'all') {
      whereCondition = 'WHERE status = $1';
      params.push(status);
      paramIndex++;
    }

    // 查詢民宿列表
    const homestaysQuery = `
      SELECT 
        id,
        name,
        location,
        city,
        image_url,
        website,
        phone,
        capacity_description,
        min_guests,
        max_guests,
        email,
        status,
        created_at,
        approved_at,
        approved_by,
        rejection_reason
      FROM homestays 
      ${whereCondition}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    // 查詢總數
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM homestays 
      ${whereCondition}
    `;

    const countParams = status !== 'all' ? [status] : [];

    console.log('執行查詢:', homestaysQuery);
    console.log('參數:', params);

    const [homestaysResult, countResult] = await Promise.all([
      pool.query(homestaysQuery, params),
      pool.query(countQuery, countParams)
    ]);

    const homestays = homestaysResult.rows;
    const total = parseInt(countResult.rows[0].total);

    // 為每個民宿獲取環境類型
    if (homestays.length > 0) {
      const homestayIds = homestays.map(h => h.id);
      const typesQuery = `
        SELECT homestay_id, type_name 
        FROM homestay_types 
        WHERE homestay_id = ANY($1)
        ORDER BY homestay_id, type_name
      `;
      
      const typesResult = await pool.query(typesQuery, [homestayIds]);
      
      // 組織類型資料
      const typesMap = {};
      typesResult.rows.forEach(row => {
        if (!typesMap[row.homestay_id]) {
          typesMap[row.homestay_id] = [];
        }
        typesMap[row.homestay_id].push(row.type_name);
      });

      // 將類型資料合併到民宿資料中
      homestays.forEach(homestay => {
        homestay.types = typesMap[homestay.id] || [];
      });
    }

    return {
      success: true,
      homestays: homestays,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        total_pages: Math.ceil(total / limit)
      },
      status_summary: await getStatusSummary()
    };

  } catch (error) {
    console.error('獲取待審核民宿錯誤:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '系統錯誤，請稍後重試'
    });
  }
});

// 獲取各狀態統計
async function getStatusSummary() {
  try {
    const summaryQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM homestays 
      GROUP BY status
      ORDER BY status
    `;
    
    const result = await pool.query(summaryQuery);
    
    const summary = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    result.rows.forEach(row => {
      summary[row.status] = parseInt(row.count);
      summary.total += parseInt(row.count);
    });

    return summary;
  } catch (error) {
    console.error('獲取狀態統計錯誤:', error);
    return {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };
  }
} 