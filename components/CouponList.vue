<template>
    <div class="map-list" :class="{ 'listOpen': isOpen }">
      <Icon
        name="ri:arrow-up-s-line"
        @click="$emit('toggle')"
        class="map-toggle"
        :class="{ 'arrow-upside': isOpen }"
      />
      <div class="map-info-wrapper" v-if="nowCoupon.title">
        <CouponInfo :couponId="nowCoupon.id" :key="nowCoupon.title">{{ 123 }}</CouponInfo>
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineProps } from 'vue';
  import CouponInfo from './CouponInfo.vue'; // 假設有一個 CouponInfo 組件
  
  const props = defineProps({
    isOpen: {
      type: Boolean,
      required: true,
    },
    nowCoupon: {
      type: Object,
      required: true,
    },
  });
  </script>
  
  <style scoped>
  .map-list {
    position: fixed;
    bottom: 0;
    height: 50px;
    width: 100%;
    background-color: #fff;
    z-index: 10;
    transition: 0.5s;
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
  
  .arrow-upside {
    transform: rotate(180deg);
    transition: 0.5s;
  }
  
  .listOpen {
    height: 380px;
  }
  
  .map-info-wrapper {
    overflow: auto;
    height: 330px;
  }
  </style>