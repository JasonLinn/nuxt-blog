<template>
  <div class="yp-page my-coupons">
    <header class="yp-page-head">
      <div>
        <span class="yp-page-head__eyebrow">我的優惠券</span>
        <h1 class="yp-page-head__title">{{ userName ? `${userName}，您好` : '我的優惠券' }}</h1>
        <p class="yp-page-head__desc">結帳時出示條碼，並請店員點擊「兌換」按鈕。</p>
      </div>
      <div class="yp-page-head__actions">
        <NuxtLink to="/" class="btn btn-soft btn-icon">
          <Icon name="ri:compass-3-line" />找更多優惠
        </NuxtLink>
      </div>
    </header>

    <!-- 尚未登入 -->
    <div v-if="!isLoggedIn" class="yp-card yp-empty">
      <div class="yp-empty__icon"><Icon name="ri:user-3-line" /></div>
      <p class="yp-empty__title">登入後查看已領優惠券</p>
      <p class="yp-empty__text">使用 LINE 登入，就能在這裡管理你領取的優惠券。</p>
      <a href="/api/line/login?returnTo=%2FuserInfo" class="btn btn-line">LINE 登入</a>
    </div>

    <!-- 載入中 -->
    <div v-else-if="!couponsLoaded && !coupons.length" class="yp-grid yp-grid--3" aria-busy="true">
      <div v-for="n in 3" :key="`skeleton-${n}`" class="yp-card">
        <div class="yp-skeleton" style="aspect-ratio: 16 / 10; border-radius: 0" />
        <div class="yp-card__body">
          <span class="yp-skeleton mb-2" style="width: 70%; height: 20px" />
          <span class="yp-skeleton mb-2" style="width: 40%" />
          <span class="yp-skeleton" style="width: 100%; height: 44px" />
        </div>
      </div>
    </div>

    <!-- 無資料 -->
    <div v-else-if="!coupons.length" class="yp-card yp-empty">
      <div class="yp-empty__icon"><Icon name="ri:coupon-3-line" /></div>
      <p class="yp-empty__title">尚未領取優惠券</p>
      <p class="yp-empty__text">逛逛宜蘭在地店家的免費優惠，領取後會顯示在這裡。</p>
      <NuxtLink to="/" class="btn btn-primary">去逛逛優惠</NuxtLink>
    </div>

    <!-- 優惠券列表 -->
    <template v-else>
      <div class="yp-toolbar">
        <div class="yp-seg" role="tablist" aria-label="優惠券狀態">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            role="tab"
            class="yp-seg__btn"
            :class="{ 'is-active': activeTab === tab.value }"
            :aria-selected="activeTab === tab.value"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}<span class="my-coupons__count yp-num">{{ tab.count }}</span>
          </button>
        </div>
      </div>

      <div v-if="!visibleCount" class="yp-card yp-empty">
        <div class="yp-empty__icon"><Icon name="ri:inbox-line" /></div>
        <p class="yp-empty__title">
          {{ activeTab === 'used' ? '還沒有已使用的優惠券' : '目前沒有可使用的優惠券' }}
        </p>
        <p class="yp-empty__text mb-0">
          {{ activeTab === 'used' ? '兌換過的優惠券會顯示在這裡。' : '去看看有哪些新優惠吧。' }}
        </p>
      </div>

      <div class="yp-grid yp-grid--3 coupon-list">
        <article
          v-for="(coupon, index) in coupons"
          v-show="isVisible(coupon)"
          :key="coupon.id + index"
          class="yp-card my-coupon"
          :class="{ 'is-used': coupon.received }"
        >
          <div class="my-coupon__media">
            <Carousel>
              <Slide v-for="img in coupon.cover" :key="img">
                <img :src="img" :alt="coupon.title" class="my-coupon__img" />
              </Slide>

              <template #addons="{ slidesCount }">
                <Navigation v-if="slidesCount > 1" />
                <Pagination v-if="slidesCount > 1" />
              </template>
            </Carousel>
            <span v-if="dealOf(coupon)" class="my-coupon__deal">{{ dealOf(coupon).label }}</span>
            <span
              class="yp-status my-coupon__status"
              :class="coupon.received ? 'yp-status--draft' : 'yp-status--approved'"
            >
              {{ coupon.received ? '已兌換' : '可使用' }}
            </span>
          </div>

          <div class="my-coupon__body">
            <h2 class="my-coupon__title">{{ coupon.title }}</h2>

            <AccordionRoot
              class="AccordionRoot"
              default-value="'item-1'"
              type="single"
              :collapsible="true"
            >
              <AccordionItem class="AccordionItem" value="item.value">
                <AccordionHeader class="AccordionHeader">
                  <AccordionTrigger class="AccordionTrigger">
                    <span>查看使用說明</span>
                    <Icon
                      name="ri:arrow-down-s-line"
                      class="AccordionChevron"
                      aria-label="展開或收合"
                    />
                  </AccordionTrigger>
                </AccordionHeader>
                <AccordionContent class="AccordionContent">
                  <div class="AccordionContentText">
                    {{ coupon.content }}
                  </div>
                  <TipText />
                </AccordionContent>
              </AccordionItem>
            </AccordionRoot>

            <ul class="yp-info-list my-coupon__info">
              <li>
                <span class="yp-info-list__label">推薦店家</span>
                <span class="yp-info-list__value">{{ coupon.referral?.name || '無' }}</span>
              </li>
              <li>
                <span class="yp-info-list__label">使用期限</span>
                <span class="yp-info-list__value yp-num">{{ new Date().getFullYear() }}/12/31</span>
              </li>
            </ul>

            <div v-if="coupon.qrCodeData" class="my-coupon__barcode">
              <span class="my-coupon__barcode-label">兌換條碼</span>
              <div class="barcode-container">
                <div v-if="!barcodeLoaded[index]" class="loading-icon">
                  <span class="spinner-border spinner-border-sm" aria-hidden="true" />
                </div>
                <canvas :id="'barcode-' + index"></canvas>
              </div>
            </div>
          </div>

          <div class="my-coupon__redeem">
            <button v-if="coupon.received" type="button" class="btn btn-light w-100" disabled>
              已兌換
            </button>
            <template v-else>
              <button
                :id="coupon.gotTime"
                type="button"
                class="btn btn-primary w-100"
                @click="received"
              >
                請店員點擊兌換
              </button>
              <p class="my-coupon__note">
                <Icon name="ri:error-warning-line" />此按鈕請交由門市人員點擊
              </p>
            </template>
          </div>
        </article>
      </div>
    </template>
  </div>
</template>

<script setup>
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger
} from 'radix-vue'
import { ref, onMounted, nextTick, watch } from 'vue'
import useStore from '~~/store'
import { extractDeal } from '~/utils/coupon-deal'

const store = useStore()
const userName = store.getUserDisplayName
const userId = store.getUserId
const couponsLoaded = ref(false)
Promise.resolve(store.getCoupons(userId)).finally(() => {
  couponsLoaded.value = true
})
const isLoggedIn = computed(() => Boolean(store.getUserId))
const coupons = computed(() => {
  const data = store.getUserCoupons
  // 確保回傳值為陣列且過濾掉 null/undefined
  return Array.isArray(data) ? data.filter(Boolean) : []
})

// 狀態分頁：可使用 / 已使用（以 v-show 切換，保留條碼 canvas）
const activeTab = ref('available')
const isUsed = (coupon) => Boolean(coupon.received)
const tabs = computed(() => [
  { value: 'available', label: '可使用', count: coupons.value.filter((c) => !isUsed(c)).length },
  { value: 'used', label: '已使用', count: coupons.value.filter(isUsed).length }
])
const isVisible = (coupon) => (activeTab.value === 'used' ? isUsed(coupon) : !isUsed(coupon))
const visibleCount = computed(() => coupons.value.filter(isVisible).length)
const dealOf = (coupon) => extractDeal(coupon.title, coupon.content)

const received = async (e) => {
  if (!confirm('是否確認兌換?')) return
  const coupon = coupons.value.find((item) => item.gotTime === e.target.id)
  if (!coupon) return
  try {
    const result = await $fetch('/api/received', {
      method: 'POST',
      body: { coupon_id: coupon.id, claimId: coupon.claimId, gotTime: coupon.gotTime }
    })
    await store.setCoupons(result.coupons)
    alert('已標註兌換!')
  } catch {
    alert('兌換失敗，請重新整理後再試。')
  }
}

const barcodeLoaded = ref({})

// 修改條碼生成函數
const generateBarcode = async (canvas, text, index) => {
  if (process.client) {
    try {
      const JsBarcode = (await import('jsbarcode')).default
      await JsBarcode(canvas, text, {
        format: 'CODE128',
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 12,
        margin: 5
      })
      barcodeLoaded.value[index] = true
    } catch (error) {
      console.error('生成條碼錯誤:', error)
      barcodeLoaded.value[index] = false
    }
  }
}

// 監聽 coupons 的變化
watch(
  () => coupons.value,
  async (newCoupons) => {
    if (newCoupons && process.client) {
      await nextTick()
      newCoupons.forEach(async (coupon, index) => {
        if (coupon.qrCodeData) {
          barcodeLoaded.value[index] = false
          const canvas = document.getElementById(`barcode-${index}`)
          if (canvas) {
            await generateBarcode(canvas, coupon.qrCodeData, index)
          }
        }
      })
    }
  },
  { immediate: true }
)

onMounted(async () => {
  if (process.client) {
    // 等待優惠券數據加載
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (coupons.value) {
      await nextTick()
      coupons.value.forEach(async (coupon, index) => {
        if (coupon.qrCodeData) {
          const canvas = document.getElementById(`barcode-${index}`)
          if (canvas) {
            await generateBarcode(canvas, coupon.qrCodeData, index)
          }
        }
      })
    }
  }
})
</script>

<style lang="scss" scoped>
.my-coupons {
  &__count {
    margin-left: 6px;
    font-size: 0.75rem;
    opacity: 0.7;
  }
}

.my-coupon {
  display: flex;
  flex-direction: column;
  height: 100%;

  &.is-used {
    .my-coupon__media,
    .my-coupon__title {
      opacity: 0.6;
    }
  }

  &__media {
    position: relative;
    aspect-ratio: 16 / 10;
    background: $yp-surface-2;
    overflow: hidden;

    :deep(.carousel),
    :deep(.carousel__viewport),
    :deep(.carousel__track),
    :deep(.carousel__slide) {
      height: 100% !important;
    }

    :deep(.carousel__pagination) {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 6px;
      margin: 0;
      padding: 0 !important;
    }
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  &__deal {
    position: absolute;
    left: 10px;
    bottom: 10px;
    z-index: 2;
    background: $yp-deal;
    color: #fff;
    font-weight: 700;
    font-size: 0.875rem;
    padding: 3px 10px;
    border-radius: $yp-radius-sm;
  }

  &__status {
    position: absolute;
    right: 10px;
    top: 10px;
    z-index: 2;
    background: rgba(255, 255, 255, 0.92);
  }

  &__body {
    flex: 1;
    padding: 14px 16px 4px;
  }

  &__title {
    font-size: 1.0625rem;
    font-weight: 700;
    line-height: 1.4;
    margin: 0 0 12px;
  }

  &__info {
    margin-top: 8px;
  }

  &__barcode {
    margin-top: 8px;
    padding: 12px;
    border: 1px dashed $yp-line;
    border-radius: $yp-radius;
    text-align: center;
    background: #fff;

    canvas {
      max-width: 100%;
      height: auto;
    }
  }

  &__barcode-label {
    display: block;
    font-size: 0.75rem;
    color: $yp-muted;
    margin-bottom: 4px;
  }

  &__redeem {
    padding: 12px 16px 16px;
  }

  &__note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    margin: 8px 0 0;
    font-size: 0.75rem;
    color: $yp-danger;
  }
}

// 使用說明（radix-vue Accordion）
.AccordionRoot {
  border: 1px solid $yp-line;
  border-radius: $yp-radius;
  overflow: hidden;
  background: $yp-surface;
}

.AccordionHeader {
  display: flex;
  margin: 0;
}

.AccordionTrigger {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 0 14px;
  border: 0;
  background: transparent;
  color: $yp-primary-ink;
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 700;

  &:hover {
    background: $yp-primary-soft;
  }
}

.AccordionChevron {
  font-size: 20px;
  transition: transform 300ms cubic-bezier(0.87, 0, 0.13, 1);
}

.AccordionTrigger[data-state='open'] > .AccordionChevron {
  transform: rotate(180deg);
}

.AccordionContent {
  overflow: hidden;
  background: $yp-bg;

  &[data-state='open'] {
    animation: slideDown 300ms cubic-bezier(0.87, 0, 0.13, 1);
  }

  &[data-state='closed'] {
    animation: slideUp 300ms cubic-bezier(0.87, 0, 0.13, 1);
  }
}

.AccordionContentText {
  padding: 12px 14px;
  font-size: 0.9375rem;
  line-height: 1.7;
  white-space: pre-wrap;
  text-align: left;
  color: $yp-ink;
}

.AccordionContent :deep(.tip-text-wrapper) {
  margin: 0 12px 12px;
}

@keyframes slideDown {
  from {
    height: 0;
  }
  to {
    height: var(--radix-accordion-content-height);
  }
}

@keyframes slideUp {
  from {
    height: var(--radix-accordion-content-height);
  }
  to {
    height: 0;
  }
}

.barcode-container {
  position: relative;
  min-height: 50px;
}

.loading-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: $yp-primary;
}
</style>
