// Google Places Photo API - 取得地點圖片
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { photo_reference, maxwidth = 800, maxheight } = body;

    if (!photo_reference) {
      throw createError({
        statusCode: 400,
        statusMessage: 'photo_reference 為必填欄位'
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

    // 建構 Google Places Photo API URL
    const photoUrl = new URL('https://maps.googleapis.com/maps/api/place/photo');
    photoUrl.searchParams.set('photo_reference', photo_reference);
    photoUrl.searchParams.set('key', apiKey);
    photoUrl.searchParams.set('maxwidth', maxwidth.toString());
    
    if (maxheight) {
      photoUrl.searchParams.set('maxheight', maxheight.toString());
    }

    // 直接回傳圖片 URL，讓前端處理
    // Google Photos API 的 URL 可以直接使用
    const finalUrl = photoUrl.toString();

    return {
      success: true,
      url: finalUrl,
      photo_reference: photo_reference,
      maxwidth: maxwidth,
      maxheight: maxheight
    };

  } catch (error) {
    console.error('建構圖片 URL 失敗:', error);
    
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: '建構圖片 URL 失敗'
    });
  }
});
