/**
 * Function will initialize Google Map with default settings
 *
 * @param map_html DOM HTML element in which Google Map will be initialized
 */
export const initializeGoogleMap = map_html => {
    if (!useGoogleMapHTML().value) {
      console.error("google_map_html is not defined")
      return
    }
  
    // Initialize Google Map
    useGoogleMap().value = new google.maps.Map(map_html, {
      center: { lat: 24.69295, lng: 121.7195 }, // Default map view position
      zoom: 12, // Default zoom
  
      styles: [
        {
          featureType: "poi",
          stylers: [{ visibility: "on" }]
        }
      ],
  
      clickableIcons: false,
      streetViewControl: false,
      mapTypeControl: false,
      draggableCursor: "crosshair",
      fullscreenControl: false,
      minZoom: 2,
  
      restriction: {
        latLngBounds: {
          north: 85,
          south: -85,
          west: -180,
          east: 180
        }
      },
  
      gestureHandling: "greedy", // Does not need 2 fingers to move on map when using touchscreen (Not working on Firefox Mobile. Safari, not sure.)
      keyboardShortcuts: false
    })
  }
  
  // Function used to center Google Map to specific coordinates
  export const centerGoogleMap = (lat, lng) => {
    const googleMap = useGoogleMap().value
  
    if (!googleMap) {
      console.error("google_map is not defined")
      return
    }
  
    googleMap.setCenter({ lat, lng })
  }
  