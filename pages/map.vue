<template>
<GMapMap
    :center="{lat: 24.69295, lng: 121.7195}"
    :zoom="12"
>
<GMapMarker
    :key="index"
    v-for="(m, index) in markers"
    :position="m.position"
    :clickable="true"
    :icon= '{
        url: "https://developers.google.com/maps/documentation/javascript/examples/full/images/info-i_maps.png",
        scaledSize: {width: 20, height: 20},
        labelOrigin: {x: 16, y: -10}
      }'
>
<GMapInfoWindow>
        <div>I am in info window <RelativeFooter/>
        </div>
      </GMapInfoWindow>
</GMapMarker>
</GMapMap>
</template>
<script setup>

const markers = reactive([
{
    position: {lat: 24.669843988805, lng: 121.748609031434},
},
{
    position: {lat: 24.69295, lng: 121.3},
}
])
</script>
<style>
.vue-map-container {
    height: 600px;
}
</style>