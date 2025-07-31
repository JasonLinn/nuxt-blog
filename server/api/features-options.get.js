import pool from '~/server/utils/db.js';

export default defineEventHandler(async (event) => {
  try {
    // 從資料庫獲取啟用的特色項目
    const query = `
      SELECT name, type 
      FROM feature_items 
      WHERE is_active = true 
      ORDER BY type, sort_order, name
    `;

    const result = await pool.query(query);
    
    // 按類型分組
    const themeFeatures = result.rows
      .filter(item => item.type === 'theme')
      .map(item => item.name);
      
    const serviceAmenities = result.rows
      .filter(item => item.type === 'service')
      .map(item => item.name);

    // 合併所有選項
    const allFeatures = [...themeFeatures, ...serviceAmenities];

    return {
      success: true,
      data: {
        themeFeatures: themeFeatures,
        serviceAmenities: serviceAmenities,
        allFeatures: allFeatures
      },
      message: '成功載入所有特色選項'
    };

  } catch (error) {
    console.error('獲取特色選項錯誤:', error);
    
    // 如果資料庫出錯，回退到預設選項
    const fallbackThemeFeatures = [
      '包棟民宿', '電梯/一樓孝親房民宿', '獨棟、莊園民宿', '親子民宿',
      '寵物民宿', '海景民宿', '市區民宿', '夜市民宿', '車站周邊住宿'
    ];

    const fallbackServiceAmenities = [
      '美味早餐', '方便停車', '有停車位(場)', '可停遊覽車',
      '有陽台房型', '有浴缸房型', '有公用客廳', '一樓孝親房',
      '戶外戲水池', '有烤肉場地', '歌唱設備', '可借用廚房',
      '可打麻將', '可帶寵物入住', '可刷國旅卡', '電動麻將桌', '充電樁'
    ];

    return {
      success: true,
      data: {
        themeFeatures: fallbackThemeFeatures,
        serviceAmenities: fallbackServiceAmenities,
        allFeatures: [...fallbackThemeFeatures, ...fallbackServiceAmenities]
      },
      message: '使用備用特色選項（資料庫連接失敗）',
      fallback: true
    };
  }
});