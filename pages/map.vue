<template>
    <div v-if="couponObject.pending">
        <Icon class="h-6 w-6 text-gray-500" name="eos-icons:loading" />
    </div>

    <template v-else>
    <div  class="map-list" :class="{ 'listOpen': isOpen }">
        <Icon name="ri:arrow-up-s-line" @click="isOpen = !isOpen" class="map-toggle" :class="{ 'arrow-upside': isOpen }" />
        <!-- <div v-for="(coupon, index) in coupons">
            <h2 class="map-coupon-title">
                {{index+ 1 + '. ' + coupon.title}}
            </h2>
        </div> -->
        <div class="map-info-wrapper" v-if="nowCoupon.title">
            <!-- <h2>{{nowCoupon.title}}</h2>
            <p>{{nowCoupon.content}}</p>
            <img :src="nowCoupon?.cover[0]" width="100" height="50" alt=""> -->
            <CouponInfo :couponId="nowCoupon.id" :key="nowCoupon.title">{{ 123 }}</CouponInfo>
        </div>
    </div>
    <div>
        <div class="map-options" id="mapCate">
            <div
              v-for="cate in category"
              @click="selectedCate = cate.id"
              :class="{ 'cateActive': selectedCate  == cate.id}"
              class="map-oitem"
            >{{ cate.name }}</div>
        </div>
        <GMapMap
            ref="mapRef"
            :center="{lat: 24.69295, lng: 121.7195}"
            :zoom="11"
            :disableDefaultUI="true"
            :gestureHandling="none"
            @click="isOpen = false"
            :options="{
                // zoomControl: true,
                minZoom: 11,
                maxZoom: 20,
                mapTypeControl: false,
                // scaleControl: false,
                streetViewControl: false,
                rotateControl: false,
                fullscreenControl: false,
                styles: [
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi.business',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'road.arterial',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'road.local',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'road.local',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  }
]
            }"
        >
                <!-- <GMapMarker
                    v-for="(coupon, index) in couponData.filter((i) => i.position?.lat)"
                    :key="coupon.title"
                    :position="coupon.position"
                    :clickable="true"
                    @click="openCoupon(coupon.id)"
                    :label='{
                        text: coupon.title,
                        fontSize: "16px",
                        background: "white"
                    }'
                    :icon= '{
                        url: `./icon/${coupon.category}.svg`,
                        scaledSize: {width: 30, height: 30},
                        labelOrigin: {x: 16, y: -10}
                    }'
                > -->
                        <!-- <GMapInfoWindow>
                        <div>{{coupon.title}}
                            <img :src="coupon.cover" height="50" alt="">
                        </div>
                    </GMapInfoWindow> -->
                <!-- </GMapMarker> -->
        </GMapMap>
    </div>
    </template>
</template>
<script setup>
import useCouponMapStore from "~~/store/couponMap";
import { category, township } from '~/utils/category';
// const handleLogout = store.resetUser;
// const icon = {
//     play: () => (<Icon name="ri:cake-3-fill"/>),
//     eat: () => (<Icon name="ri:cake-3-fill"/>),
//     traffic: () => (<Icon name="ri:cake-3-fill"/>)
// }
const route = useRoute()
const currentCate = computed(() => route?.query?.cate)
const searchText = ref('')
let currentPage = ref(1)
const selectedTown = ref(null)
const selectedCate = ref(null)
const isOpen = ref(false)
const store = useCouponMapStore();
let nowId = ref(1)
let nowCoupon = reactive({})
const couponObject = computed(() => store.getCouponData)
const couponData = computed(() =>selectedCate ? couponObject?.value?.data?.items : couponObject?.value?.data?.items.filter((i) => i.category == selectedCate))
if (!couponData?.value?.length){
  store.fetchAndSetCoupon({pageSize: 150})
}

const mapRef = ref({})
let map;
let infoWindow;
let markers = [];
onMounted(()=>{
  // 避免還沒loading couponData
  setTimeout(() => {
    if (mapRef) {
        mapRef.value?.$mapPromise?.then(map=> {
          // addMyButton(map);
          google.maps.gestureHandling = "greedy";
          couponData.value.filter((i) => i.position?.lat).map((c) =>{
            addMarker(c, map)
          })
          document
            .getElementById("mapCate")
            .addEventListener("click", showMarkers);

            // 設定 icon scaled
            google.maps.event.addListener(map, 'zoom_changed', function() {
              var zoom = map.getZoom();
              let markerWidth = (zoom/12)*25
              let markerHeight = (zoom/12)*25


              //set the icon with the new size to the marker
              markers = markers.map((marker) => {
                marker.setMap(null)
                marker.icon.scaledSize.height = markerHeight
                marker.icon.scaledSize.width = markerWidth

                if (marker.label) {
                  if (zoom > 12){
                    marker.label.fontSize = `${zoom}px`
                  } else {
                    marker.label.fontSize = 0
                  }
                }
                return marker
              })

              setMapOnAll(map)
              if (selectedCate.value) {
                hideMarkers()
              }
            });
            // scaled end


            // Shows any markers currently in the array.
            function showMarkers() {
                if (selectedCate.value) {
                  hideMarkers()
                  return
                }
                markers.map((m) => bounce(m))
                setMapOnAll(map);
            }

            // Removes the markers from the map, but keeps them in the array.
            function hideMarkers() {
                markers.filter((m)=> m.category == selectedCate.value).map((marker)=> {
                    bounce(marker)
                    marker.setMap(map)
                })
                markers.filter((m)=> m.category != selectedCate.value).map((marker) => {
                    marker.setMap(null)
                })
            }
            function bounce(marker) {
                marker.setAnimation(google.maps.Animation.BOUNCE)
                setTimeout(function ()
                {
                    marker.setAnimation(null);
                }, 1400);

            }

            infoWindow = new google.maps.InfoWindow();

            const locationButton = document.createElement("img");

            // locationButton.textContent = "Current Location";
            locationButton.src = "./icon/location.png";
            locationButton.classList.add("custom-map-control-button");
            map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locationButton);
            locationButton.addEventListener("click", () => {
                // Try HTML5 geolocation.
                if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };

                        const markerLoc = new google.maps.Marker({
                            position: pos,
                            map: map,
                            icon: {
                                url: './icon/location-point.svg',
                                scaledSize: {width: 30, height: 30}
                            }
                        });
                        markers.push(markerLoc)

                        infoWindow.setPosition(pos);
                        infoWindow.setContent("Location found.");
                        // infoWindow.open(map);
                        map.setCenter(pos);
                    },
                    () => {
                    handleLocationError(true, infoWindow, map.getCenter());
                    },
                );
                } else {
                // Browser doesn't support Geolocation
                handleLocationError(false, infoWindow, map.getCenter());
                }
            });
        })
      }
  }, 500);
})


function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation.",
  );
  infoWindow.open(map);
}
function addMyButton(map) {
  const controlUI = document.createElement("button");
  controlUI.title = "Click to zoom the map";
  const controlText = document.createElement("div");
  controlText.innerHTML = `Center`;
  controlUI.appendChild(controlText);

  controlUI.addEventListener("click", () => {
    map.setZoom(map.getZoom() + 1);
  });

  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(controlUI); // eslint-disable-line no-undef

  // This event listener calls addMarker() when the map is clicked.
//   google.maps.event.addListener(map, "click", (event) => {
//     addMarker(event.latLng, map);
//     console.log(markers)
//   });
}
function addMarker(coupon, map) {
    // Add the marker at the clicked location, and add the next-available label
    // from the array of alphabetical characters.
    const marker = new google.maps.Marker({
      position: coupon.position,
      category: coupon.category,
      clickable: true,
      label:{
            text: coupon.title,
            fontSize: "0",
            background: "white"
        },
      icon: {
            url: `./icon/${coupon.category}.png`,
            scaledSize: {width: 25, height: 25},
            labelOrigin: {x: 16, y: -10}
        },
      map: map,
    });
    marker.setAnimation(google.maps.Animation.BOUNCE)
    setTimeout(function ()
        {
            marker.setAnimation(null);
            // $(marker).dequeue();
        }, 2000);
    marker.addListener("click", () => {
        openCoupon(coupon.id)
    });
    markers.push(marker);
}
function setMapOnAll(map, category) {
  for (let i = 0; i < markers.length; i++) {
    markers[i]?.setMap(map);
  }
}





// Deletes all markers in the array by removing references to them.
// function deleteMarkers() {
//   hideMarkers();
//   markers = [];
// }
// const markers = reactive([
// {
//     position: {lat: 24.669843988805, lng: 121.748609031434},
// },
// {
//     position: {lat: 24.69295, lng: 121.3},
// }
// ])

const clickCategory = () => {

}
const openCoupon = (id) => {
    isOpen.value = false
    isOpen.value = true
    nowId.value = id
    nowCoupon = couponData.value.find((coupon) => coupon.id == id)
    // nowCoupon = coupons.find((coupon) => coupon.id == id)
    console.log(nowId, 'nnnnnnnnnn')
}
const coupons = [
        {
            "id": 97,
            "title": "水岸森林物語",
            "category": "play",
            "content": "門票（全票）九折",
            "cover": [
                "https://yilanpass.com/shop/319798.jpg"
            ],
            "amount": 9995,
            "used_times": 0,
            "isReferral": false,
            "hash": [
                ""
            ],
            "updated_at": "2024-11-14T14:24:47.265Z",
            "adress": [
                "宜蘭縣冬山鄉光華二路36號"
            ],
            "township": [
                "冬山鄉"
            ],
            "isonce": false,
            "position": {
                lng: 121.75371,
                lat: 24.677407
            }
        },
        {
            "id": 80,
            "title": "長春241親子蹦蹦車（安安企業社）",
            "category": "play",
            "content": "一團招待蹦蹦車免費玩2次",
            "cover": [
                "https://yilanpass.com/shop/319102.jpg"
            ],
            "amount": 10000,
            "used_times": 0,
            "isReferral": false,
            "hash": [
                ""
            ],
            "updated_at": "2024-11-11T07:13:24.877Z",
            "adress": [
                "宜蘭縣冬山鄉長春路241號"
            ],
            "township": [
                "冬山鄉"
            ],
            "isonce": false,
            "position": {
                lng: 121.35371,
                lat: 24.377407
            }
        },
        {
            "id": 51,
            "title": "長埤湖精靈村丨可愛動物區",
            "category": "play",
            "content": "限可愛動物區，全票半價入園",
            "cover": [
                "https://yilanpass.com/relative/jinlin.jpg",
                "https://yilanpass.com/relative/jinlin1.jpg",
                "https://yilanpass.com/relative/jinlin2.jpg"
            ],
            "amount": 10000,
            "used_times": 0,
            "isReferral": true,
            "hash": [
                ""
            ],
            "updated_at": "2024-10-26T14:19:46.280Z",
            "adress": [
                "宜蘭縣三星鄉三星路八段288號長埤湖風景區"
            ],
            "township": [
                "三星鄉"
            ],
            "isonce": false,
            "position": {
                lng: 121.614046,
                lat: 24.6379
            }
        }]
        coupons.map((i) => console.log(i.position))
</script>
<style>
.map-list {
    position: fixed;
    bottom: 0;
    height: 50px;
    width: 100%;
    background-color: #fff;
    z-index: 10;
    transition: .5s;
    padding: 30px 20px 20px 20px;
    border-radius: 30px 30px 0 0;
}
.map-toggle {
    width: 25px;
    height: 25px;
    position: absolute;
    top: 1px;
    left: 0;
    right: 0;
    margin: auto;
}
.custom-map-control-button {
  width: 30px;
  height: 30px;
  right: 15px !important;
}
.arrow-upside {
    transform: rotate(180deg);
    transition: .5s;
}
.listOpen {
    height: 380px;
}
.map-info-wrapper {
    overflow: auto;
    height: 330px;
}
.map-coupon-title {
    font-weight: bold;
}
.gm-style-iw-chr {
    display: none;
}
.map-options {
    display: flex;
    position: absolute;
    width: 80%;
    height: 40px;
    background-color: #fff;
    z-index: 1;
    justify-content: space-around;
    align-items: center;
    top: 78px;
    border-radius: 20px;
    cursor: pointer;
}
.map-oitem {
    flex: 1;
    text-align: center;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.cateActive {
  background-color: #ccc;
}
.gm-style-pbc{
    display: none !important
}
</style>