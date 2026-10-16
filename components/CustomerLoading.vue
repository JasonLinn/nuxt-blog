<template>
  <span v-show="isLoading" class="yp-loading" role="status" aria-live="polite">
    <span class="spinner-border spinner-border-sm" aria-hidden="true" />
    <span class="visually-hidden">載入中…</span>
  </span>
</template>

<script setup>
defineProps({
  isLoading: { type: Boolean, default: true }
})
</script>

<style scoped lang="scss">
.yp-loading {
  display: inline-flex;
  align-items: center;
  margin-left: 12px;
  color: $yp-primary;
}
</style>
