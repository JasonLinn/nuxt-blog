<template>
  <div class="map-list" :class="{ listOpen: isOpen }">
    <button
      type="button"
      class="map-toggle"
      :aria-expanded="isOpen"
      aria-label="展開或收合優惠資訊"
      @click="$emit('toggle')"
    >
      <Icon
        name="ri:arrow-up-s-line"
        class="map-toggle__icon"
        :class="{ 'arrow-upside': isOpen }"
      />
    </button>
    <div v-if="nowCoupon.title" class="map-info-wrapper">
      <CouponInfo :key="nowCoupon.title" :coupon-id="nowCoupon.id" />
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import CouponInfo from './couponInfo.vue'

defineEmits(['toggle'])
defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  nowCoupon: {
    type: Object,
    required: true
  }
})
</script>

<style scoped lang="scss">
// 浮動面板：手機要停在底部 Tab Bar 上方
.map-list {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(#{$yp-tabbar-h} + env(safe-area-inset-bottom));
  height: 56px;
  z-index: 10;
  background: $yp-surface;
  border-radius: $yp-radius-xl $yp-radius-xl 0 0;
  box-shadow: 0 -12px 30px -16px rgba(19, 48, 58, 0.4);
  padding: 32px 16px 16px;
  transition: height 0.4s ease;

  @media (min-width: $yp-bp-md) {
    bottom: 0;
  }
}

.listOpen {
  height: 380px;
}

.map-toggle {
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: $yp-muted;

  &__icon {
    font-size: 24px;
    transition: transform 0.4s ease;
  }
}

.arrow-upside {
  transform: rotate(180deg);
}

.map-info-wrapper {
  overflow: auto;
  height: 100%;
}
</style>
