import { pool } from '../utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { id } = query;

    if (!id) {
      return {
        success: false,
        error: '缺少民宿 ID 參數'
      };
    }

    // 轉換ID為整數
    const homestayId = parseInt(id, 10);
    
    if (isNaN(homestayId)) {
      return {
        success: false,
        error: 'ID 格式不正確'
      };
    }

    console.log('查詢民宿詳情，原始ID:', id, '轉換後ID:', homestayId);

    // 獲取民宿基本資訊
    const homestayQuery = `
      SELECT 
        h.id,
        h.name,
        h.location,
        h.city,
        h.image_url,
        h.images,
        h.website,
        h.phone,
        h.capacity_description,
        h.min_guests,
        h.max_guests,
        h.min_price,
        h.max_price,
        h.average_price,
        h.rating,
        h.total_reviews,
        h.featured,
        h.view_count
      FROM homestays h
      WHERE h.id = $1 AND h.available = true
    `;

    console.log('執行查詢:', homestayQuery, '參數:', [homestayId]);
    const homestayResult = await pool.query(homestayQuery, [homestayId]);
    console.log('查詢結果數量:', homestayResult.rows.length);
    
    if (homestayResult.rows.length === 0) {
      return {
        success: false,
        error: '找不到指定的民宿'
      };
    }

    const homestay = homestayResult.rows[0];
    console.log('找到民宿:', homestay.name);

    // 獲取民宿類型
    const typesQuery = `
      SELECT type_name 
      FROM homestay_types 
      WHERE homestay_id = $1
      ORDER BY type_name
    `;
    
    // 獲取價格選項
    const pricingQuery = `
      SELECT 
        price_description,
        price_amount,
        is_weekday,
        is_package
      FROM homestay_pricing 
      WHERE homestay_id = $1
      ORDER BY price_amount
    `;

    const [typesResult, pricingResult] = await Promise.all([
      pool.query(typesQuery, [homestayId]),
      pool.query(pricingQuery, [homestayId])
    ]);

    console.log('類型數量:', typesResult.rows.length, '價格選項數量:', pricingResult.rows.length);

    // 處理圖片資料 - 優先使用 images 陣列
    let imageUrls = [];
    if (homestay.images && Array.isArray(homestay.images) && homestay.images.length > 0) {
      // 使用新的 images 陣列，過濾掉空值
      imageUrls = homestay.images.filter(url => url && url.trim());
    } else if (homestay.image_url) {
      // 備用：使用舊的 image_url 欄位
      imageUrls = [homestay.image_url];
    }

    // 轉換為舊格式以相容現有頁面
    const bnb = {
      id: homestay.id,
      name: homestay.name,
      area: homestay.location,
      address: homestay.city,
      description: homestay.capacity_description,
      image_urls: imageUrls,
      features: {
        peopleTypes: [homestay.capacity_description],
        environmentTypes: typesResult.rows.map(row => row.type_name)
      },
      prices: {
        weekday: null,
        weekend: null,
        fullRentWeekday: null,
        fullRentWeekend: null
      },
      contact: {
        phone: homestay.phone,
        website: homestay.website,
        line: null
      },
      // 新增欄位
      rating: homestay.rating,
      total_reviews: homestay.total_reviews,
      featured: homestay.featured,
      view_count: homestay.view_count,
      min_price: homestay.min_price,
      max_price: homestay.max_price,
      min_guests: homestay.min_guests,
      max_guests: homestay.max_guests
    };

    // 處理價格資訊
    pricingResult.rows.forEach(pricing => {
      const formattedPrice = `NT$ ${new Intl.NumberFormat('zh-TW').format(pricing.price_amount)}`;
      
      if (pricing.is_package) {
        if (pricing.is_weekday) {
          bnb.prices.fullRentWeekday = formattedPrice;
        } else {
          bnb.prices.fullRentWeekend = formattedPrice;
        }
      } else {
        if (pricing.is_weekday) {
          bnb.prices.weekday = formattedPrice;
        } else {
          bnb.prices.weekend = formattedPrice;
        }
      }
    });

    // 更新查看次數
    const updateViewQuery = `
      UPDATE homestays 
      SET view_count = view_count + 1 
      WHERE id = $1
    `;
    await pool.query(updateViewQuery, [homestayId]);

    return {
      success: true,
      bnb: bnb
    };

  } catch (error) {
    console.error('獲取民宿詳情錯誤:', error);
    return {
      success: false,
      error: '載入民宿詳情時發生錯誤: ' + error.message
    };
  }
}); 