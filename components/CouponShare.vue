<template>
  <details
    ref="menu"
    class="coupon-share"
    :class="{ 'coupon-share--start': align === 'start' }"
    @keydown.esc.prevent="closeMenu"
  >
    <summary class="btn btn-soft btn-sm btn-icon"><Icon name="ri:share-line" />分享</summary>
    <div class="coupon-share__menu">
      <button type="button" class="coupon-share__item" :disabled="copying" @click="copyLink">
        <Icon name="ri:link" />{{ copying ? '複製中…' : '複製連結' }}
      </button>
      <a
        class="coupon-share__item"
        :href="lineShareUrl"
        target="_blank"
        rel="noopener noreferrer"
        @click="closeMenu"
      >
        <Icon name="ri:line-fill" />分享到 LINE
      </a>
      <p v-if="copyStatus" class="coupon-share__status" role="status">{{ copyStatus }}</p>
      <input
        v-if="copyFailed"
        class="form-control form-control-sm"
        aria-label="優惠券分享連結"
        :value="couponUrl"
        readonly
        @focus="$event.target.select()"
        @click="$event.target.select()"
      />
    </div>
  </details>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  couponId: { type: [String, Number], required: true },
  title: { type: String, default: '' },
  align: { type: String, default: 'end' }
})

const menu = ref(null)
const copying = ref(false)
const copyStatus = ref('')
const copyFailed = ref(false)
// Use the coupon identity, including when this component appears on the map or wallet.
const couponUrl = computed(
  () => `https://yilanpass.com/articles/${encodeURIComponent(props.couponId)}`
)
const lineShareUrl = computed(
  () =>
    `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
      couponUrl.value
    )}&text=${encodeURIComponent(props.title)}`
)

function closeMenu() {
  if (menu.value) menu.value.open = false
}

function closeOutside(event) {
  if (menu.value && !menu.value.contains(event.target)) closeMenu()
}

async function copyLink() {
  if (copying.value) return
  copying.value = true
  copyStatus.value = ''
  copyFailed.value = false
  try {
    await navigator.clipboard.writeText(couponUrl.value)
    copyStatus.value = '已複製連結！'
  } catch {
    copyFailed.value = true
    copyStatus.value = '無法自動複製，請選取下方連結複製。'
  } finally {
    copying.value = false
  }
}

onMounted(() => document.addEventListener('pointerdown', closeOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOutside))
</script>

<style scoped lang="scss">
.coupon-share {
  position: relative;
  z-index: 5;

  summary {
    list-style: none;
    min-height: 40px;

    &::-webkit-details-marker {
      display: none;
    }
  }

  &__menu {
    position: absolute;
    right: 0;
    top: calc(100% + 6px);
    width: 220px;
    padding: 6px;
    background: $yp-surface;
    border: 1px solid $yp-line;
    border-radius: $yp-radius;
    box-shadow: $yp-shadow-lg;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 12px;
    border: 0;
    border-radius: $yp-radius-sm;
    background: transparent;
    color: $yp-ink;
    font-size: 0.9375rem;
    text-align: left;
    text-decoration: none;

    &:hover,
    &:focus-visible {
      background: $yp-primary-soft;
      color: $yp-primary-ink;
    }
  }

  &--start &__menu {
    right: auto;
    left: 0;
  }

  &__status {
    margin: 6px;
    color: $yp-muted;
    font-size: 0.875rem;
  }
}
</style>
