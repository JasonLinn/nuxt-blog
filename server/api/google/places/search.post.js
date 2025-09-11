// Google Places API - 搜尋地點
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { query, location, radius = 50000 } = body;

    if (!query) {
      throw createError({
        statusCode: 400,
        statusMessage: '搜尋關鍵字為必填欄位'
      });
    }

    const config = useRuntimeConfig();
    const apiKey = config.GOOGLE_MAPS_API_KEY || config.public.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Google Maps API Key 未設定'
      });
    }

    // 使用 Google Places Text Search API
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    searchUrl.searchParams.set('query', query);
    searchUrl.searchParams.set('location', location);
    searchUrl.searchParams.set('radius', radius.toString());
    searchUrl.searchParams.set('key', apiKey);
    searchUrl.searchParams.set('language', 'zh-TW');
    searchUrl.searchParams.set('region', 'tw');

    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places API 錯誤:', data);
      throw createError({
        statusCode: 500,
        statusMessage: `Google Places API 錯誤: ${data.status}`
      });
    }

    // 格式化結果
    const places = data.results.map(place => ({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      geometry: place.geometry,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      price_level: place.price_level,
      types: place.types,
      photos: place.photos || []
    }));

    return {
      success: true,
      data: places
    };

  } catch (error) {
    console.error('搜尋地點失敗:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '搜尋地點失敗'
    });
  }
});
