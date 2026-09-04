/**
 * Initializes open-source Leaflet map (backward compatible helper)
 *
 * @param map_html DOM HTML element in which Map will be initialized
 */
export const initializeGoogleMap = async (map_html: HTMLElement) => {
  if (process.server) return;
  
  try {
    const L = await import('leaflet');
    
    const map = L.map(map_html, {
      center: [24.69295, 121.7195],
      zoom: 12
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    useGoogleMap().value = map;
    return map;
  } catch (error) {
    console.error('Failed to initialize map:', error);
  }
};

// Function used to center Map to specific coordinates
export const centerGoogleMap = (lat: number, lng: number) => {
  const map = useGoogleMap().value;

  if (!map) {
    console.error("map is not defined");
    return;
  }

  if (typeof map.setView === 'function') {
    map.setView([lat, lng]);
  } else if (typeof map.setCenter === 'function') {
    map.setCenter({ lat, lng });
  }
};