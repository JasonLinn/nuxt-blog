<template>
  <div class="open-map-wrapper">
    <div id="map" ref="mapContainer" class="map-view"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const mapContainer = ref(null)
let mapInstance = null

onMounted(async () => {
  if (process.server || !mapContainer.value) return

  try {
    const L = await import('leaflet')
    mapInstance = L.map(mapContainer.value, {
      center: [24.69295, 121.7195],
      zoom: 12
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(mapInstance)

    useGoogleMap().value = mapInstance
  } catch (error) {
    console.error('Failed to initialize Leaflet map:', error)
  }
})

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})
</script>

<style scoped lang="scss">
.open-map-wrapper {
  width: 100%;
  height: 100%;
  min-height: 320px;
  overflow: hidden;
  background: $yp-surface-2;
  border-radius: $yp-radius-lg;
}

.map-view {
  width: 100%;
  height: 100%;
  min-height: 320px;
}

@media (min-width: $yp-bp-md) {
  .map-view {
    min-height: 480px;
  }
}
</style>
