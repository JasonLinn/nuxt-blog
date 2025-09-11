import VueGoogleMaps from "@fawmi/vue-google-maps"

export default defineNuxtPlugin((nuxtApp) => {
    const runtimeConfig = useRuntimeConfig();
    const MAP_API_KEY = runtimeConfig.public.GOOGLE_MAPS_API_KEY;
    
    console.log('Google Maps Plugin: API Key available:', !!MAP_API_KEY);
    
    // 使用 vue-google-maps 套件載入 API
    nuxtApp.vueApp.use(VueGoogleMaps, {
      load: {
        key: MAP_API_KEY,
        libraries: "places,geometry,drawing"
      },
      installComponents: true,
    });
    
    console.log('Google Maps Plugin: Vue Google Maps configured');
    
    // 當 vue-google-maps 載入完成後，發送自定義事件
    const checkGoogleMaps = () => {
      if (typeof google !== 'undefined') {
        console.log('Google Maps Plugin: API available, dispatching event');
        window.dispatchEvent(new Event('google-maps-loaded'));
      } else {
        // 如果還沒載入，繼續檢查
        setTimeout(checkGoogleMaps, 100);
      }
    };
    
    // 開始檢查
    setTimeout(checkGoogleMaps, 1000);
  });
