import bcrypt from 'bcryptjs';
import { pool } from '../utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const {
      account,
      password,
      email,
      name,
      location,
      city,
      image_url,
      images,
      capacity_description,
      min_guests,
      max_guests,
      types,
      theme_features,
      service_amenities,
      phone,
      website,
      social,
      pricing
    } = body;

    // 驗證必要欄位
    if (!account || !password || !email || !name || !location || !city) {
      throw createError({
        statusCode: 400,
        statusMessage: '帳號、密碼、信箱、民宿名稱、地區和詳細地址為必填欄位'
      });
    }

    // 驗證帳號格式（只能是數字）
    if (!/^\d+$/.test(account)) {
      throw createError({
        statusCode: 400,
        statusMessage: '民宿編號只能包含數字'
      });
    }

    // 驗證信箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: '請輸入有效的電子信箱'
      });
    }

    // 驗證密碼長度
    if (password.length < 6) {
      throw createError({
        statusCode: 400,
        statusMessage: '密碼至少需要6個字元'
      });
    }

    // 開始交易
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 檢查民宿編號是否已存在
      const existingHomestayQuery = 'SELECT id FROM homestays WHERE id = $1';
      const existingHomestay = await client.query(existingHomestayQuery, [account]);
      
      if (existingHomestay.rows.length > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: '此民宿編號已被使用，請使用其他編號'
        });
      }

      // 檢查信箱是否已被使用
      const existingEmailQuery = 'SELECT id FROM homestays WHERE email = $1';
      const existingEmail = await client.query(existingEmailQuery, [email]);
      
      if (existingEmail.rows.length > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: '此信箱已被註冊，請使用其他信箱'
        });
      }

      // 處理圖片資料
      let finalImages = [];
      if (images && Array.isArray(images) && images.length > 0) {
        // 如果有新的圖片陣列，使用它
        finalImages = images;
      } else if (image_url) {
        // 如果沒有新的圖片陣列但有舊的單一圖片URL，使用它
        finalImages = [image_url];
      }

      // 加密密碼
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 插入民宿基本資訊
      const insertHomestayQuery = `
        INSERT INTO homestays (
          id,
          name,
          location,
          city,
          image_url,
          images,
          website,
          phone,
          social_line,
          social_instagram,
          social_facebook,
          capacity_description,
          min_guests,
          max_guests,
          theme_features,
          service_amenities,
          email,
          password_hash,
          status,
          available,
          featured,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, $16, $17, 'pending', false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING id, name, status
      `;

      const homestayValues = [
        account, // 保持為字串，因為資料庫 id 欄位是 VARCHAR 類型
        name,
        location,
        city, // city 已經在前面驗證過為必填，不需要 || null
        finalImages.length > 0 ? finalImages[0] : '',
        finalImages,
        website || null,
        phone || null,
        social?.line || null,
        social?.instagram || null,
        social?.facebook || null,
        capacity_description || null,
        min_guests || null,
        max_guests || null,
        JSON.stringify(theme_features || []),
        JSON.stringify(service_amenities || []),
        email,
        passwordHash
      ];

      const homestayResult = await client.query(insertHomestayQuery, homestayValues);
      const homestayId = homestayResult.rows[0].id;

      // 插入環境類型（如果有選擇的話）
      if (types && types.length > 0) {
        const typeQueries = types.map(type => 
          client.query(
            'INSERT INTO homestay_types (homestay_id, type_name) VALUES ($1, $2)',
            [homestayId, type]
          )
        );
        await Promise.all(typeQueries);
      }

      // 記錄申請日誌
      console.log(`新民宿申請: ID=${homestayId}, 名稱=${name}, 申請人=${email}, 時間=${new Date().toISOString()}`);

      // 提交交易
      await client.query('COMMIT');

      return {
        success: true,
        message: '民宿申請已成功提交，等待管理員審核',
        data: {
          id: homestayId,
          name: name,
          status: 'pending',
          email: email,
          created_at: new Date().toISOString()
        }
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('民宿註冊錯誤:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '註冊系統發生錯誤，請稍後重試'
    });
  }
}); 