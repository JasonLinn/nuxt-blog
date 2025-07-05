export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const query = getQuery(event);
  
  // 如果是獲取 API Key
  if (query.type === 'key') {
    // 確保 API Key 存在
    if (!config.GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API Key not found in runtime config');
      throw createError({
        statusCode: 500,
        statusMessage: 'Google Maps API Key not configured'
      });
    }

    return {
      key: config.GOOGLE_MAPS_API_KEY
    };
  }
  
  // 如果是地址查詢
  if (query.type === 'geocode' && query.address) {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query.address)}&key=${config.GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    return data;
  }
  
  throw createError({
    statusCode: 400,
    statusMessage: '無效的請求類型'
  });
}); 