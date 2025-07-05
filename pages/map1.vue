<template>
    <div v-if="couponObject.pending">
        <Icon class="h-6 w-6 text-gray-500" name="eos-icons:loading" />
    </div>

    <template v-else>
    <div class="map-list" :class="{ 'listOpen': isOpen }">
        <Icon name="ri:arrow-up-s-line" @click="isOpen = !isOpen" class="map-toggle" :class="{ 'arrow-upside': isOpen }" />
        <div class="map-info-wrapper" v-if="nowCoupon.title">
            <CouponInfo :couponId="nowCoupon.id" :key="nowCoupon.title">{{ 123 }}</CouponInfo>
        </div>
    </div>
    <div>
        <div class="map-options" id="mapCate">
            <div
              v-for="cate in category"
              :key="cate.id"
              @click="selectedCate = selectedCate === cate.id ? null : cate.id"
              :class="{ 'cateActive': selectedCate == cate.id}"
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
                minZoom: 11,
                maxZoom: 20,
                mapTypeControl: false,
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
        />
    </div>
    </template>
</template>
<script setup>
import useCouponMapStore from "~~/store/couponMap";
import { category, township } from '~/utils/category';
import { ref, computed, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

// 基本資料狀態
const route = useRoute();
const currentCate = computed(() => route?.query?.cate);
const searchText = ref('');
const currentPage = ref(1);
const selectedTown = ref(null);
const selectedCate = ref(null);
const isOpen = ref(false);
const store = useCouponMapStore();
const nowId = ref(1);
const nowCoupon = reactive({});
const mapRef = ref({});

// 建立標記列表
let map;
let infoWindow;
let markers = [];

// 從 store 取得優惠券資料
const couponObject = computed(() => store.getCouponData);
const couponData = computed(() => {
  if (!couponObject.value?.data?.items) return [];
  return selectedCate.value 
    ? couponObject.value.data.items.filter(i => i.category === selectedCate.value)
    : couponObject.value.data.items;
});

// 如果沒有資料，則取得資料
if (!couponObject.value?.data?.items?.length) {
  store.fetchAndSetCoupon({pageSize: 150});
}

// 打開優惠券詳情
function openCoupon(id) {
  isOpen.value = true;
  nowId.value = id;
  nowCoupon.title = null; // 確保重新渲染
  
  // 使用 nextTick 確保 UI 更新
  setTimeout(() => {
    const coupon = couponData.value.find(c => c.id === id);
    if (coupon) {
      Object.assign(nowCoupon, coupon);
    }
  }, 0);
}

// 添加標記函數 - 優化以避免重複創建
function addMarker(coupon, mapInstance) {
  if (!coupon?.position?.lat) return null;
  
  const marker = new google.maps.Marker({
    position: coupon.position,
    category: coupon.category,
    clickable: true,
    label: {
      text: coupon.title,
      fontSize: "0", // 初始不顯示文字
      background: "white"
    },
    icon: {
      url: `./icon/${coupon.category}.png`,
      scaledSize: new google.maps.Size(25, 25),
      labelOrigin: new google.maps.Point(16, -10)
    },
    map: mapInstance,
  });
  
  // 添加彈跳動畫效果
  marker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(() => {
    marker.setAnimation(null);
  }, 2000);
  
  // 添加點擊事件
  marker.addListener("click", () => {
    openCoupon(coupon.id);
  });
  
  return marker;
}

// 在地圖上顯示所有標記
function setMapOnAll(mapInstance) {
  for (let i = 0; i < markers.length; i++) {
    markers[i]?.setMap(mapInstance);
  }
}

// 顯示標記
function showMarkers() {
  if (selectedCate.value) {
    hideMarkers();
    return;
  }
  
  markers.forEach(m => {
    // 添加彈跳效果
    m.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(() => {
      m.setAnimation(null);
    }, 1400);
  });
  
  setMapOnAll(map);
}

// 隱藏標記
function hideMarkers() {
  // 顯示所選類別的標記
  markers.filter(m => m.category === selectedCate.value).forEach(marker => {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(() => {
      marker.setAnimation(null);
    }, 1400);
    marker.setMap(map);
  });
  
  // 隱藏其他類別的標記
  markers.filter(m => m.category !== selectedCate.value).forEach(marker => {
    marker.setMap(null);
  });
}

// 處理定位錯誤
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  if (!infoWindow || !pos) return;
  
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}

// 監聽選擇的類別變化
watch(selectedCate, (newVal, oldVal) => {
  if (map && markers.length) {
    if (newVal) {
      hideMarkers();
    } else {
      setMapOnAll(map);
    }
  }
});

// 監聽優惠券數據變化，更新標記
watch(couponData, (newCoupons) => {
  if (map && newCoupons.length && markers.length === 0) {
    newCoupons.filter(i => i.position?.lat).forEach(c => {
      const marker = addMarker(c, map);
      if (marker) markers.push(marker);
    });
  }
}, { deep: true });

// 元件掛載後初始化地圖
onMounted(() => {
  // 避免還沒 loading couponData
  setTimeout(() => {
    if (!mapRef.value) return;
    
    mapRef.value.$mapPromise?.then(mapInstance => {
      map = mapInstance;
      google.maps.gestureHandling = "greedy";
      
      // 初次加載時創建標記
      couponData.value.filter(i => i.position?.lat).forEach(c => {
        const marker = addMarker(c, map);
        if (marker) markers.push(marker);
      });
      
      // 添加類別過濾監聽
      document
        .getElementById("mapCate")
        ?.addEventListener("click", showMarkers);
        
      // 設定 icon scaled - 監聽縮放變化
      google.maps.event.addListener(map, 'zoom_changed', function() {
        const zoom = map.getZoom();
        const markerWidth = (zoom/12)*25;
        const markerHeight = (zoom/12)*25;
        
        // 更新所有標記的圖示大小
        markers.forEach(marker => {
          marker.setMap(null);
          if (marker.icon && marker.icon.scaledSize) {
            marker.icon.scaledSize = new google.maps.Size(markerWidth, markerHeight);
          }
          
          if (marker.label) {
            marker.label.fontSize = zoom > 12 ? `${zoom}px` : "0";
          }
        });
        
        // 重新顯示標記
        setMapOnAll(map);
        if (selectedCate.value) {
          hideMarkers();
        }
      });
      
      // 創建定位視窗
      infoWindow = new google.maps.InfoWindow();
      
      // 添加定位按鈕
      const locationButton = document.createElement("img");
      locationButton.src = "./icon/location.png";
      locationButton.classList.add("custom-map-control-button");
      map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locationButton);
      
      // 添加定位按鈕點擊事件
      locationButton.addEventListener("click", () => {
        // 嘗試 HTML5 定位
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              
              // 添加當前位置標記
              const markerLoc = new google.maps.Marker({
                position: pos,
                map: map,
                icon: {
                  url: './icon/location-point.svg',
                  scaledSize: new google.maps.Size(30, 30)
                }
              });
              markers.push(markerLoc);
              
              // 顯示定位訊息
              infoWindow.setPosition(pos);
              infoWindow.setContent("Location found.");
              map.setCenter(pos);
            },
            () => {
              handleLocationError(true, infoWindow, map.getCenter());
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            }
          );
        } else {
          // 瀏覽器不支援定位
          handleLocationError(false, infoWindow, map.getCenter());
        }
      });
    });
  }, 1000);
});
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