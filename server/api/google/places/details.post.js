// Google Places API - 取得地點詳細資料
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { place_id } = body;

    if (!place_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'place_id 為必填欄位'
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

    // 使用 Google Places Details API
    const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    detailsUrl.searchParams.set('place_id', place_id);
    detailsUrl.searchParams.set('key', apiKey);
    detailsUrl.searchParams.set('language', 'zh-TW');
    detailsUrl.searchParams.set('fields', [
      'place_id',
      'name',
      'formatted_address',
      'address_components',
      'geometry',
      'formatted_phone_number',
      'website',
      'rating',
      'user_ratings_total',
      'price_level',
      'opening_hours',
      'photos',
      'types',
      'reviews'
    ].join(','));

    const response = await fetch(detailsUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places Details API 錯誤:', data);
      throw createError({
        statusCode: 500,
        statusMessage: `Google Places Details API 錯誤: ${data.status}`
      });
    }

    const place = data.result;

    // 格式化詳細資料
    const placeDetails = {
      place_id: place.place_id,
      google_place_id: place.place_id, // 添加 google_place_id 支援
      name: place.name,
      formatted_address: place.formatted_address,
      address_components: place.address_components,
      geometry: place.geometry,
      latitude: place.geometry?.location?.lat,
      longitude: place.geometry?.location?.lng,
      formatted_phone_number: place.formatted_phone_number,
      website: place.website,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      price_level: place.price_level,
      opening_hours: place.opening_hours,
      photos: place.photos || [],
      place_types: place.types,
      types: place.types, // 保持向後相容
      reviews: place.reviews || [],
      business_status: place.business_status
    };

    return {
      success: true,
      data: placeDetails
    };

  } catch (error) {
    console.error('取得地點詳情失敗:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '取得地點詳情失敗'
    });
  }
});
