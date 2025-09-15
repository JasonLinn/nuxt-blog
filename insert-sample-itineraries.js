// 插入推薦行程測試資料
const { createPool } = require('@vercel/postgres');

// 你需要設定實際的資料庫連接字串
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

async function insertSampleData() {
  const pool = createPool({
    connectionString: connectionString
  });

  const client = await pool.connect();

  try {
    // 插入範例推薦行程
    const sampleItineraries = [
      {
        title: '宜蘭經典一日遊',
        description: '最適合初次造訪宜蘭的經典路線，包含必訪景點與在地美食',
        days: 1,
        image_url: '/yilan-activities/yilan-classic.jpg',
        difficulty_level: 'easy',
        price_range: 'budget',
        tags: JSON.stringify(['經典路線', '適合新手', '親子友善']),
        places: JSON.stringify([
          ['冬山河親水公園', '宜蘭傳藝園區', '羅東夜市']
        ]),
        is_active: true
      },
      {
        title: '礁溪溫泉度假之旅',
        description: '享受礁溪溫泉與周邊景點的放鬆旅程',
        days: 2,
        image_url: '/yilan-activities/jiaoxi-hotspring.jpg',
        difficulty_level: 'easy',
        price_range: 'mid',
        tags: JSON.stringify(['溫泉', '放鬆', '美食']),
        places: JSON.stringify([
          ['湯圍溝溫泉公園', '礁溪溫泉會館'],
          ['五峰旗瀑布', '龍潭湖', '柯氏蔥油餅']
        ]),
        is_active: true
      },
      {
        title: '太平山森林浴之旅',
        description: '深入太平山國家森林遊樂區，體驗芬多精與自然美景',
        days: 2,
        image_url: '/yilan-activities/taipingshan.jpg',
        difficulty_level: 'medium',
        price_range: 'mid',
        tags: JSON.stringify(['森林', '登山', '自然']),
        places: JSON.stringify([
          ['太平山莊', '翠峰湖'],
          ['見晴懷古步道', '鳩之澤溫泉']
        ]),
        is_active: true
      },
      {
        title: '宜蘭親子農場體驗',
        description: '適合全家大小的農場體驗行程，讓孩子親近動物與自然',
        days: 1,
        image_url: '/yilan-activities/family-farm.jpg',
        difficulty_level: 'easy',
        price_range: 'budget',
        tags: JSON.stringify(['親子', '農場', '體驗活動']),
        places: JSON.stringify([
          ['宜農牧場', '廣興農場', '香草菲菲']
        ]),
        is_active: true
      },
      {
        title: '東澳海岸線探索',
        description: '探索宜蘭東部海岸的壯麗景色與原住民文化',
        days: 2,
        image_url: '/yilan-activities/dongao-coast.jpg',
        difficulty_level: 'medium',
        price_range: 'mid',
        tags: JSON.stringify(['海岸', '原住民文化', '秘境']),
        places: JSON.stringify([
          ['東澳灣', '粉鳥林漁港'],
          ['南澳海蝕洞', '朝陽步道', '南澳農場']
        ]),
        is_active: true
      }
    ];

    for (const itinerary of sampleItineraries) {
      await client.query(`
        INSERT INTO recommended_itineraries 
        (title, description, days, image_url, difficulty_level, price_range, tags, places, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        itinerary.title,
        itinerary.description,
        itinerary.days,
        itinerary.image_url,
        itinerary.difficulty_level,
        itinerary.price_range,
        itinerary.tags,
        itinerary.places,
        itinerary.is_active
      ]);
    }

    console.log('成功插入', sampleItineraries.length, '筆推薦行程資料');

  } catch (error) {
    console.error('插入資料失敗:', error);
  } finally {
    client.release();
  }
}

// 執行插入
insertSampleData().catch(console.error);
