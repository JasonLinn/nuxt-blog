<template>
  <li v-if="activity.price != null">
    <span class="yp-info-list__label">活動費用</span>
    <span class="yp-info-list__value">{{ activity.price === 0 ? '免費' : `NT$ ${activity.price}` }}</span>
  </li>
  <li v-if="activity.capacity != null">
    <span class="yp-info-list__label">人數限制</span>
    <span class="yp-info-list__value">{{ activity.capacity }} 人</span>
  </li>
  <li v-if="activity.website">
    <span class="yp-info-list__label">活動網站</span>
    <span class="yp-info-list__value">
      <a :href="activity.website" target="_blank" rel="noopener noreferrer">{{ activity.website }}</a>
    </span>
  </li>
</template>

<script setup>
defineProps({ activity: { type: Object, required: true } })
</script>
