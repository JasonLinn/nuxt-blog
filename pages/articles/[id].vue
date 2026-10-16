<template>
  <div class="yp-page detail-page" :class="{ 'has-cta': hasAction }">
    <!-- 載入中 -->
    <div v-if="pending" class="yp-detail detail-grid" aria-busy="true">
      <div class="detail-main">
        <div class="yp-card detail-gallery">
          <div class="yp-skeleton detail-skeleton-media" />
        </div>
        <div class="yp-card yp-card__section detail-head">
          <span class="yp-skeleton mb-3" style="width: 30%; height: 22px" />
          <span class="yp-skeleton mb-2" style="width: 70%; height: 30px" />
          <span class="yp-skeleton" style="width: 40%" />
        </div>
        <div class="yp-card yp-card__section detail-section">
          <span class="yp-skeleton mb-2" style="width: 90%" />
          <span class="yp-skeleton mb-2" style="width: 80%" />
          <span class="yp-skeleton" style="width: 60%" />
        </div>
      </div>
      <aside class="yp-detail__aside detail-aside">
        <div class="yp-card yp-card__section">
          <span class="yp-skeleton mb-3" style="width: 50%; height: 56px" />
          <span class="yp-skeleton mb-3" style="width: 90%" />
          <span class="yp-skeleton" style="width: 100%; height: 48px" />
        </div>
      </aside>
    </div>

    <template v-else>
      <!-- 錯誤狀態 -->
      <div v-if="error || !article" class="yp-card yp-empty yp-empty--error">
        <div class="yp-empty__icon"><Icon name="ri:error-warning-line" /></div>
        <p class="yp-empty__title">發生了一點錯誤</p>
        <p class="yp-empty__text">暫時無法載入這張優惠券，請稍後再試。</p>
        <div class="d-flex justify-content-center gap-2">
          <button type="button" class="btn btn-primary" @click="$router.go(0)">重新載入</button>
          <NuxtLink to="/" class="btn btn-soft">回到首頁</NuxtLink>
        </div>
      </div>

      <template v-else>
        <!-- 麵包屑 -->
        <nav class="yp-breadcrumb" aria-label="目前位置">
          <NuxtLink to="/">首頁</NuxtLink>
          <span class="yp-clamp-1">{{ article.title }}</span>
        </nav>

        <div class="yp-detail detail-grid">
          <div class="detail-main">
            <!-- 圖片輪播 -->
            <section class="yp-card detail-gallery" aria-label="優惠券圖片">
              <Carousel v-if="article.cover?.length">
                <Slide v-for="(img, index) in article.cover" :key="img">
                  <img
                    :src="img"
                    :alt="`${article.title} 圖片 ${index + 1}`"
                    class="detail-gallery__img"
                    :loading="index === 0 ? 'eager' : 'lazy'"
                    @click="showImg(index)"
                  />
                </Slide>
                <template #addons="{ slidesCount }">
                  <Navigation v-if="slidesCount > 1" />
                  <Pagination v-if="slidesCount > 1" />
                </template>
              </Carousel>
              <div v-else class="detail-gallery__empty">
                <Icon name="ri:image-line" />
              </div>
            </section>
            <VueEasyLightbox
              :visible="visibleRef"
              :imgs="article.cover"
              :index="indexRef"
              @hide="onHide"
            />

            <!-- 標題與工具 -->
            <header class="yp-card yp-card__section detail-head">
              <div class="yp-tags mb-2">
                <span class="yp-tag yp-tag--primary">{{ categoryLabel }}</span>
                <span v-if="townshipText" class="yp-tag">
                  <Icon name="ri:map-pin-2-line" />{{ townshipText }}
                </span>
                <span v-if="article.isonce" class="yp-tag yp-tag--deal">限量・每帳號限領一次</span>
                <span v-if="article.isReferral" class="yp-tag yp-tag--warning">需推薦代碼</span>
              </div>
              <h1 class="detail-title">{{ article.title }}</h1>

              <div class="detail-tools">
                <span v-if="article.view_count" class="detail-views">
                  <Icon name="ri:eye-line" />{{
                    Number(article.view_count).toLocaleString('zh-TW')
                  }}
                  次瀏覽
                </span>
                <div class="detail-tools__actions">
                  <div
                    class="detail-share"
                    tabindex="0"
                    @click="isOpenShare = !isOpenShare"
                    @blur="isOpenShare = false"
                  >
                    <span class="btn btn-soft btn-sm btn-icon">
                      <Icon name="ri:share-line" />分享
                    </span>
                    <div v-show="isOpenShare" class="detail-share__menu" @mousedown.prevent>
                      <button type="button" class="detail-share__item" @click="shareCopy">
                        <Icon name="ri:link" />複製連結
                      </button>
                      <button type="button" class="detail-share__item" @click="shareCoupon">
                        <Icon name="ri:line-fill" />分享到 LINE
                      </button>
                    </div>
                  </div>
                  <template v-if="isBackendAdmin">
                    <NuxtLink
                      class="btn btn-sm btn-outline-primary btn-icon"
                      :to="{ name: 'articles-edit', query: { id: route.params.id } }"
                    >
                      <Icon name="ri:edit-line" />編輯
                    </NuxtLink>
                    <button
                      v-if="!article.archived_at"
                      type="button"
                      class="btn btn-sm btn-outline-danger btn-icon"
                      @click="handleArchiveArticle"
                    >
                      <Icon name="ri:archive-line" />封存
                    </button>
                    <span v-else class="yp-status yp-status--draft">已封存</span>
                  </template>
                </div>
              </div>
            </header>

            <!-- 優惠內容 -->
            <section class="yp-card yp-card__section detail-section">
              <h2 class="detail-section__title">優惠內容</h2>
              <div class="yp-prose detail-prose">{{ article.content }}</div>

              <div v-if="parsedTags.length" class="yp-tags detail-tags">
                <NuxtLink
                  v-for="tag in parsedTags"
                  :key="tag"
                  :to="{ name: 'index', query: { search: tag } }"
                  class="yp-tag"
                >
                  # {{ tag }}
                </NuxtLink>
              </div>
            </section>

            <!-- 店家資訊 -->
            <section v-if="article.adress?.[0]" class="yp-card yp-card__section detail-section">
              <h2 class="detail-section__title">店家資訊</h2>
              <ul class="yp-info-list">
                <li>
                  <span class="yp-info-list__label">地址</span>
                  <span class="yp-info-list__value">
                    <a
                      target="_blank"
                      rel="noopener"
                      class="detail-map-link"
                      :href="`https://www.google.com/maps/?q=${article.title} ${article.adress[0]}`"
                    >
                      <Icon name="ri:map-pin-2-fill" />{{ article.adress[0] }}
                    </a>
                  </span>
                </li>
                <li v-if="townshipText">
                  <span class="yp-info-list__label">地區</span>
                  <span class="yp-info-list__value">{{ townshipText }}</span>
                </li>
                <li>
                  <span class="yp-info-list__label">類別</span>
                  <span class="yp-info-list__value">{{ categoryLabel }}</span>
                </li>
              </ul>
              <a
                target="_blank"
                rel="noopener"
                class="btn btn-soft btn-icon mt-3"
                :href="`https://www.google.com/maps/?q=${article.title} ${article.adress[0]}`"
              >
                <Icon name="ri:navigation-line" />在 Google 地圖開啟
              </a>
            </section>

            <!-- 旅遊通提醒 -->
            <TipText />
          </div>

          <!-- 側欄：優惠值 + 領取 -->
          <aside class="yp-detail__aside detail-aside">
            <div class="yp-card detail-claim">
              <div class="detail-claim__body">
                <div class="detail-ticket">
                  <div class="detail-ticket__stub">
                    <template v-if="deal && deal.unit">
                      <b class="detail-ticket__num yp-num">{{ deal.short }}</b>
                      <span class="detail-ticket__unit">{{ deal.unit }}</span>
                    </template>
                    <template v-else>
                      <Icon
                        :name="deal ? 'ri:gift-2-line' : 'ri:coupon-3-line'"
                        class="detail-ticket__icon"
                      />
                      <span class="detail-ticket__unit">{{
                        deal ? deal.label : article.isonce ? '限量' : '免費'
                      }}</span>
                    </template>
                  </div>
                  <div class="detail-ticket__info">
                    <span class="detail-claim__eyebrow">優惠內容</span>
                    <p class="detail-claim__offer">
                      {{
                        offerSummary ||
                        (article.isonce ? '限量優惠，領完為止' : '免費領取，出示即可使用')
                      }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- 推薦店家 -->
              <div v-if="article.isReferral" class="detail-referral">
                <div class="detail-referral__store">
                  <span>推薦店家：{{ referralStore?.name || '無' }}</span>
                  <Icon
                    v-show="referralStore?.name"
                    name="ri:checkbox-circle-fill"
                    class="detail-referral__ok"
                  />
                </div>
                <label for="referral-code" class="form-label">輸入推薦代碼</label>
                <div class="input-group">
                  <input
                    id="referral-code"
                    v-model="referralCode"
                    type="text"
                    class="form-control"
                    placeholder="請輸入代碼"
                    autocomplete="off"
                  />
                  <button type="button" class="btn btn-outline-primary" @click="checkReferral">
                    驗證
                  </button>
                </div>
              </div>

              <div
                v-show="showPass || article.isReferral || article.isonce"
                class="detail-info-row"
              >
                <div v-show="showPass" class="detail-pass">
                  <Icon name="ri:checkbox-circle-fill" />
                  <div>
                    <b>出示即可使用</b>
                    <span>請向店員出示本頁最新畫面</span>
                  </div>
                </div>
                <div v-show="article.isReferral || article.isonce" class="detail-amount">
                  剩餘數量：<b class="yp-num">{{ article.amount }}</b>
                </div>
              </div>

              <!-- 領取操作（手機固定在 Tab Bar 上方） -->
              <div v-show="hasAction" class="detail-actions">
                <button
                  v-show="article.isReferral && !isCheckReferral"
                  type="button"
                  class="btn btn-light btn-lg w-100"
                  disabled
                >
                  請輸入推薦代碼
                </button>
                <button
                  v-show="checkIsOnce() && article.isonce && isCheckReferral"
                  type="button"
                  class="btn btn-light btn-lg w-100"
                  disabled
                >
                  每個帳號限領一次
                </button>
                <button
                  v-show="checkIsOnce() && article.isonce && !isCheckReferral"
                  type="button"
                  class="btn btn-light btn-lg w-100"
                  disabled
                >
                  每個帳號限領一次
                </button>
                <button
                  v-show="article.amount && article.hash && isCheckReferral && !checkIsOnce()"
                  type="button"
                  class="btn btn-primary btn-lg w-100"
                  @click="handleHashRecive"
                >
                  領取限量優惠券
                </button>
                <button
                  v-show="article.amount && !article.hash && canClaim && !checkIsOnce()"
                  type="button"
                  class="btn btn-primary btn-lg w-100"
                  :disabled="iconLoading"
                  @click="getCupon"
                >
                  領取優惠券
                  <span
                    v-show="iconLoading"
                    class="spinner-border spinner-border-sm ms-2"
                    aria-hidden="true"
                  />
                </button>
                <button
                  v-show="article.amount && article.hash && !isCheckReferral && !checkIsOnce()"
                  type="button"
                  class="btn btn-primary btn-lg w-100"
                  @click="handleHashRecive"
                >
                  領取限量優惠券
                </button>
                <button v-show="soldOut" type="button" class="btn btn-light btn-lg w-100" disabled>
                  已領完
                </button>
                <ClientOnly>
                  <p v-if="hasAction && !userId" class="detail-login-hint">
                    <Icon name="ri:line-fill" />領取需先以 LINE 登入
                  </p>
                </ClientOnly>
              </div>
            </div>
          </aside>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
/* eslint-disable no-unused-vars, no-unreachable, eqeqeq, camelcase, n/handle-callback-err -- 保留既有領取 / LIFF 邏輯，本次只重構 UI */
import liff from '@line/liff'
import { onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue'
import { index_liff_url } from '~/utils/static'
import useReferralStore from '~/store/referral'
import useStore from '~/store'
import { category } from '~/utils/category'
import { extractDeal, summarizeOffer } from '~/utils/coupon-deal'

const route = useRoute()
const store = useStore()
const userData = computed(() => store.getUserData)
const userId = computed(() => store.getUserId)

// Helpers
const parseTags = (tagsString) => {
  if (!tagsString) return []
  // Split by hash, comma, or space. Remove empty results, trim spaces.
  return tagsString
    .split(/#|,| /)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

// const { $bootstrap } = useNuxtApp();
const modalRef = ref(null)
const referralCode = ref('')
const isOpenShare = ref(false)
const iconLoading = ref(false)
let modal = null
const showQRCode = ref(false)
const qrCodeData = ref('')
const hash = []
const liffUrl = 'https://liff.line.me/2005661804-zld9QenV/'

/*  lightbox  */
const referralStore = ref(null)
const isCheckReferral = ref(false)
// 可領取：需推薦碼的券要先驗證代碼；限領一次但不需推薦碼的券可直接領取
const canClaim = computed(
  () => isCheckReferral.value || Boolean(article.value?.isonce && !article.value?.isReferral)
)
const visibleRef = ref(false)
const indexRef = ref(0)

const imgs = [
  'https://via.placeholder.com/450.png/',
  'https://via.placeholder.com/300.png/',
  'https://via.placeholder.com/150.png/',
  { src: 'https://via.placeholder.com/450.png/', title: 'this is title' }
]

const showImg = (index) => {
  indexRef.value = index
  visibleRef.value = true
}
const onHide = () => (visibleRef.value = false)
/* lightbox end */
// const referralStore = referral.find((ref) => {
//   if (!store.getReferral?.referral) {
//     return null
//   }
//   console.log(ref, store.getReferral.referral)
//   return ref.code == store.getReferral.referral
// })

// 初始化 modal
onMounted(() => {
  if (process.client && typeof document !== 'undefined' && modalRef.value) {
    // 在客戶端動態導入 bootstrap
    import('bootstrap/dist/js/bootstrap.bundle')
      .then((bootstrap) => {
        modal = new bootstrap.default.Modal(modalRef.value)
      })
      .catch((error) => {
        console.error('無法加載 Bootstrap:', error)
      })
  }
})

// 清理 modal
onBeforeUnmount(() => {
  if (process.client && modal) {
    modal.dispose()
  }
})

// 顯示 modal 的方法
const showModal = () => {
  if (process.client && modal) {
    showQRCode.value = false
    qrCodeData.value = ''
    modal.show()
  }
}

// 關閉 modal 的方法
const hideModal = () => {
  if (process.client && modal) {
    modal.hide()
  }
}

const {
  pending,
  data: article,
  error
} = await useFetch(`/api/articles/${route.params.id}`, {
  headers: useRequestHeaders(['cookie'])
})
// article.value.referral = referralStore
if (error.value) {
  console.log(error.value)
  throw createError({ statusCode: 404 })
}

const userInfo = useState('userInfo')
const isBackendAdmin = ref(false)

const checkBackendAdmin = async () => {
  try {
    const response = await $fetch('/api/admin-auth', {
      headers: useRequestHeaders(['cookie'])
    })
    isBackendAdmin.value = Boolean(response?.success && response?.admin)
  } catch (error) {
    isBackendAdmin.value = false
  }
}

await checkBackendAdmin()

const checkIsOnce = () => {
  let wasGet = false
  const whiteList = []
  // 查詢該帳號是否領過
  wasGet = userData?.value?.coupons.some((cup) => {
    try {
      const parsed = JSON.parse(cup)
      return parsed && article.value && parsed.id == article.value.id
    } catch (e) {
      console.log('JSON.parse 失敗:', cup, e)
      return false
    }
  })
  return wasGet && article.value && article.value.isonce
}

/* ── 顯示用資料（只影響畫面，不影響領取邏輯）── */
const categoryLabels = { eat: '美食', play: '玩樂', live: '住宿', traffic: '交通' }
const categoryLabel = computed(() => {
  const id = article.value?.category
  return categoryLabels[id] || category.find((c) => c.id === id)?.name || '優惠'
})
const townshipText = computed(() => {
  const list = article.value?.township
  return Array.isArray(list) ? list.filter(Boolean).join('、') : ''
})
const parsedTags = computed(() => parseTags(article.value?.tags))
const deal = computed(() =>
  article.value ? extractDeal(article.value.title, article.value.content) : null
)
const offerSummary = computed(() =>
  article.value ? summarizeOffer(article.value.content, 60) : ''
)

// 「出示即可使用」提示、領取按鈕區的顯示條件（與下方按鈕的 v-show 條件一致）
const showPass = computed(() =>
  Boolean(article.value && !article.value.isonce && !article.value.isReferral)
)
const actionFlags = computed(() => {
  const a = article.value
  if (!a) return { show: false, soldOut: false }
  const once = Boolean(checkIsOnce())
  const needReferral = Boolean(a.isReferral && !isCheckReferral.value)
  const onceLimited = once && Boolean(a.isonce)
  const claimHash = Boolean(a.amount && a.hash && !once)
  const claim = Boolean(a.amount && !a.hash && canClaim.value && !once)
  const soldOut = Boolean(
    !a.amount && (a.isonce || a.isReferral || a.hash) && !needReferral && !onceLimited
  )
  return { show: needReferral || onceLimited || claimHash || claim || soldOut, soldOut }
})
const hasAction = computed(() => actionFlags.value.show)
const soldOut = computed(() => actionFlags.value.soldOut)

const handleArchiveArticle = () => {
  if (!process.client) return
  if (!article.value) {
    console.log('無法封存，article 不存在')
    return
  }
  const answer = confirm('你確定要封存優惠券嗎？封存後前台將無法看到這張優惠券。')

  if (answer) {
    $fetch(`/api/admin/coupons/${route.params.id}/archive`, {
      method: 'POST'
    })
      .then(() => {
        navigateTo('/admin/coupons?status=archived')
      })
      .catch((error) => {
        console.log(error)
      })
  }
}

const sendPatch = async () => {} // Inventory is part of the claim transaction.
const patchUser = async () => {
  iconLoading.value = true
  try {
    const result = await $fetch('/api/user/appendCoupon', {
      method: 'PATCH',
      body: { articleId: article.value.id, referralCode: referralStore.value?.code }
    })
    article.value.amount = result.amount
    store.recordClaim(result.coupon)
    alert('領取成功!')
    await navigateTo('/userInfo')
    return result
  } finally {
    iconLoading.value = false
  }
}

const checkReferral = async () => {
  try {
    if (!referralCode.value) {
      if (process.client) alert('請輸入推薦代碼')
      return
    }

    const response = await $fetch('/api/referral', {
      method: 'POST',
      body: {
        code: referralCode.value
      }
    })

    referralStore.value = response.data
    isCheckReferral.value = true
    if (process.client) alert('成功代入: ' + referralStore.value.name)
  } catch (error) {
    console.error('檢查推薦代碼時發生錯誤:', error)

    // 根据错误状态码显示不同的错误信息
    if (process.client) {
      if (error.response?.status === 404) {
        alert('無效的推薦代碼')
      } else if (error.response?.status === 400) {
        alert('請輸入推薦代碼')
      } else {
        alert('系統錯誤，請稍後再試')
      }
    }

    referralStore.value = null
    isCheckReferral.value = false
  }
}

// 添加新的條碼生成函數
const generateBarcode = async (canvas, text) => {
  // 確保在客戶端環境並且 document 存在
  if (process.client && typeof document !== 'undefined' && canvas) {
    try {
      const JsBarcode = (await import('jsbarcode')).default
      JsBarcode(canvas, text, {
        format: 'CODE128',
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 20,
        margin: 10
      })
    } catch (error) {
      console.error('生成條碼錯誤:', error)
    }
  }
}

// 添加一個函數來生成 LINE 登錄 URL
const getLineLoginUrl = (state) => {
  if (!process.client || typeof window === 'undefined') return ''

  // 獲取當前的 URL 協議和主機名
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  const port = window.location.port ? `:${window.location.port}` : ''
  const baseUrl = `${protocol}//${hostname}${port}`

  // 構建完整的回調 URL
  const redirectUri = encodeURIComponent(`${baseUrl}/line_callback`)

  return `/api/line/login?returnTo=${encodeURIComponent(state)}`
}

const handleHashRecive = async () => {
  try {
    // 檢查是否已登入
    if (!userId.value) {
      if (process.client) {
        alert('請先登入')
        hideModal()
        // 使用函數生成 LINE 登錄 URL
        navigateTo(getLineLoginUrl(route.path), { external: true })
      }
      return
    }

    const result = await patchUser()
    qrCodeData.value = result.coupon.qrCodeData
    showQRCode.value = true
  } catch (error) {
    console.error('Error:', error)

    if (process.client) {
      if (error.response?.status === 400) {
        alert('參數錯誤：' + error.response._data.message)
      } else {
        alert('生成序號失敗，請稍後再試')
      }

      hideModal()
    }
  }
}

const getCupon = async () => {
  if (iconLoading.value) return
  if (!userId.value) {
    alert('請先登入')
    await navigateTo(getLineLoginUrl(route.path), { external: true })
    return
  }
  try {
    await patchUser()
  } catch (error) {
    alert(
      error.response?.status === 409
        ? '此優惠券已領取或已無庫存，請重新整理。'
        : '領取失敗，請稍後再試。'
    )
  }
  return
  // let checkIcon = referralStore?.value?.name ? "https://yilanpass.com/icon/check-circle-fill.svg" : "";
  const cupon = {
    type: 'bubble',
    size: 'giga',
    hero: {
      type: 'image',
      url: article.value.cover[0],
      size: 'full',
      aspectRatio: '20:10',
      aspectMode: 'cover',
      action: {
        type: 'uri',
        uri: liffUrl + 'articles/' + article.value.id
      }
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: article.value.title,
          weight: 'bold',
          size: 'xl',
          action: {
            type: 'uri',
            uri: liffUrl + 'articles/' + article.value.id
          }
        },
        // 隱藏無用星星
        // {
        //   "type": "box",
        //   "layout": "baseline",
        //   "margin": "md",
        //   "contents": [
        //     {
        //       "type": "icon",
        //       "size": "sm",
        //       "url": "https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png"
        //     },
        //     {
        //       "type": "icon",
        //       "size": "sm",
        //       "url": "https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png"
        //     },
        //     {
        //       "type": "icon",
        //       "size": "sm",
        //       "url": "https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png"
        //     },
        //     {
        //       "type": "icon",
        //       "size": "sm",
        //       "url": "https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png"
        //     },
        //     {
        //       "type": "icon",
        //       "size": "sm",
        //       "url": "https://developers-resource.landpress.line.me/fx/img/review_gray_star_28.png"
        //     }
        //   ]
        // },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          action: {
            type: 'uri',
            uri: liffUrl + 'articles/' + article.value.id
          },
          contents: [
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: '推薦店家',
                  color: '#aaaaaa',
                  size: 'sm',
                  flex: 2
                },
                {
                  type: 'text',
                  text: referralStore?.value?.name || '無',
                  wrap: true,
                  color: '#666666',
                  size: 'sm',
                  flex: 5
                }
              ]
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              paddingBottom: 'md',
              contents: [
                {
                  type: 'text',
                  text: '序號',
                  color: '#aaaaaa',
                  size: 'sm',
                  flex: 2
                },
                {
                  type: 'text',
                  text: article.value.hash || '無序號',
                  wrap: true,
                  color: '#666666',
                  size: 'sm',
                  flex: 5
                },
                {
                  type: 'icon',
                  size: 'xl',
                  url: 'https://yilanpass.com/one_text.png',
                  position: 'absolute',
                  offsetEnd: '10px',
                  offsetBottom: '3px'
                }
              ]
            },
            {
              type: 'separator'
            },
            {
              type: 'box',
              layout: 'baseline',
              spacing: 'sm',
              paddingTop: 'md',
              contents: [
                // {
                //   "type": "text",
                //   "text": "說明",
                //   "color": "#aaaaaa",
                //   "size": "sm",
                //   "flex": 2
                // },
                {
                  type: 'text',
                  text: article.value.content,
                  wrap: true,
                  color: '#666666',
                  size: 'sm',
                  flex: 5
                }
              ]
            }
          ]
        }
      ]
    }
    // "footer": {
    //   "type": "box",
    //   "layout": "vertical",
    //   "spacing": "sm",
    //   "contents": [
    //     {
    //       "type": "separator"
    //     },
    //     {
    //       "type": "button",
    //       "style": "link",
    //       "height": "sm",
    //       "action": {
    //         "type": "uri",
    //         "label": "優惠券說明",
    //         "uri": liffUrl + 'articles/' +article.value.id
    //       }
    //     },
    //     {
    //       "type": "box",
    //       "layout": "vertical",
    //       "contents": [],
    //       "margin": "sm"
    //     }
    //   ],
    //   "flex": 0
    // }
  }

  liff
    .sendMessages([
      {
        type: 'flex',
        altText: '優惠券-' + article.value.title,
        contents: cupon
      }
    ])
    .then((res) => {
      window.alert('成功領取優惠券!')
      liff.getProfile().then((profile) => {
        if (!liff.isLoggedIn()) {
          return
        }
        patchUser(profile)
      })
      sendPatch()
    })
    .catch((error) => window.alert('未登入LINE帳號' + error))
}
const shareCopy = () => {
  if (process.client) {
    navigator.clipboard.writeText(index_liff_url + route.path)
    window?.alert('已複製連結!')
  }
}
const shareCoupon = () => {
  if (!process.client) return

  liff
    .shareTargetPicker(
      [
        {
          type: 'flex',
          altText: '宜蘭旅遊通-優惠券',
          contents: {
            type: 'bubble',
            header: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    {
                      type: 'image',
                      url: article.value.cover[0],
                      size: 'full',
                      aspectMode: 'cover',
                      aspectRatio: '2:1',
                      gravity: 'center',
                      flex: 1
                    },
                    {
                      type: 'box',
                      layout: 'horizontal',
                      contents: [
                        {
                          type: 'text',
                          text: '推薦',
                          size: 'xs',
                          color: '#ffffff',
                          align: 'center',
                          gravity: 'center'
                        }
                      ],
                      backgroundColor: '#EC3D44',
                      paddingAll: '2px',
                      paddingStart: '4px',
                      paddingEnd: '4px',
                      flex: 0,
                      position: 'absolute',
                      offsetStart: '18px',
                      offsetTop: '18px',
                      cornerRadius: '100px',
                      width: '48px',
                      height: '25px'
                    }
                  ]
                }
              ],
              paddingAll: '0px'
            },
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'box',
                      layout: 'vertical',
                      contents: [
                        {
                          type: 'text',
                          contents: [],
                          size: 'xl',
                          wrap: true,
                          text: article.value.title,
                          color: '#ffffff',
                          weight: 'bold'
                        }
                        // {
                        //   "type": "text",
                        //   "text": "3 Bedrooms, ¥35,000",
                        //   "color": "#ffffffcc",
                        //   "size": "sm"
                        // }
                      ],
                      spacing: 'sm'
                    },
                    {
                      type: 'box',
                      layout: 'vertical',
                      contents: [
                        {
                          type: 'text',
                          text: '點我看更多',
                          color: '#Ffffff',
                          align: 'center'
                        }
                      ],
                      paddingAll: '13px',
                      backgroundColor: '#ffffff1A',
                      cornerRadius: '30px',
                      margin: 'xl'
                    }
                  ]
                }
              ],
              paddingAll: '20px',
              backgroundColor: '#464F69'
            },
            action: {
              type: 'uri',
              label: 'action',
              uri: liffUrl + 'articles/' + article.value.id
            }
          }
        }
      ],
      {
        isMultiple: true
      }
    )
    .then(function (res) {
      if (res) {
        // succeeded in sending a message through TargetPicker
        console.log(`[${res.status}] Message sent!`)
      } else {
        // sending message canceled
        console.log('TargetPicker was closed!')
      }
    })
    .catch(function (error) {
      // something went wrong before sending a message
      console.log('something wrong happen')
    })
}

// SEO 優化
const { origin } = useRequestURL()
const { baseURL } = useRuntimeConfig().app
const description = article.value.content.replace(/\n/g, ' ').substring(0, 160)
const tags = parseTags(article.value.tags).join(', ')

useHead({
  title: `${article.value.title} | 宜蘭旅遊通 - 優惠券詳情`,
  meta: [
    { name: 'keywords', content: `${tags}, 宜蘭優惠, 宜蘭旅遊, 優惠券` },
    { name: 'author', content: '宜蘭旅遊通' }
  ],
  link: [
    {
      rel: 'canonical',
      href: `${origin}${baseURL}articles/${article.value.id}`
    }
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: article.value.title,
        description,
        image: article.value.cover[0],
        brand: {
          '@type': 'Brand',
          name: '宜蘭旅遊通'
        },
        offers: {
          '@type': 'Offer',
          url: `${origin}${baseURL}articles/${article.value.id}`,
          priceCurrency: 'TWD',
          price: '0',
          availability: 'https://schema.org/InStock',
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: 'TW',
            returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted'
          },
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingRate: {
              '@type': 'MonetaryAmount',
              value: 0,
              currency: 'TWD'
            },
            shippingDestination: {
              '@type': 'DefinedRegion',
              addressCountry: 'TW'
            }
          }
        }
      })
    }
  ]
})

useSeoMeta({
  description,
  ogTitle: `${article.value.title} | 宜蘭旅遊通`,
  ogDescription: description,
  ogImage: article.value.cover[0],
  ogUrl: () => `${origin}${baseURL}articles/${article.value.id}`,
  ogType: 'website',
  twitterTitle: `${article.value.title} | 宜蘭旅遊通`,
  twitterDescription: description,
  twitterImage: article.value.cover[0],
  twitterCard: 'summary_large_image'
})
</script>
<style scoped lang="scss">
// 優惠券詳情頁：頁面專屬版面（其餘樣式來自設計系統 .yp-*）
.detail-page {
  padding-top: 16px;

  @media (min-width: $yp-bp-md) {
    padding-top: 24px;
  }

  // 手機固定 CTA 列：預留空間，避免內容被遮住
  &.has-cta {
    @media (max-width: #{$yp-bp-lg - 1px}) {
      padding-bottom: 96px;
    }
  }
}

.detail-grid {
  gap: 16px 24px;
}

// 手機：main 攤平成 grid 子項，才能把「優惠值卡」排到標題之後、內文之前
.detail-main {
  display: contents;

  @media (min-width: $yp-bp-lg) {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }
}

.detail-gallery {
  order: 1;
  position: relative;
  min-width: 0;

  :deep(.carousel) {
    --vc-nav-background: rgba(255, 255, 255, 0.92);
    --vc-nav-color: #{$yp-ink};
    --vc-nav-color-hover: #{$yp-primary-ink};
    --vc-pgn-background-color: rgba(255, 255, 255, 0.6);
    --vc-pgn-active-color: #fff;
    --vc-pgn-width: 8px;
    --vc-pgn-height: 8px;
  }

  :deep(.carousel__slide) {
    height: auto !important;
    aspect-ratio: 16 / 10;
    background: $yp-surface-2;
  }

  :deep(.carousel__pagination) {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 6px;
    margin: 0;
    padding: 0;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    cursor: zoom-in;
  }

  &__empty {
    aspect-ratio: 16 / 10;
    display: grid;
    place-items: center;
    background: $yp-surface-2;
    color: $yp-subtle;
    font-size: 48px;
  }
}

.detail-skeleton-media {
  aspect-ratio: 16 / 10;
  border-radius: 0;
}

.detail-head {
  order: 2;
  min-width: 0;
}

.detail-title {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.35;
  margin: 0;
  word-break: break-word;

  @media (min-width: $yp-bp-md) {
    font-size: 1.875rem;
  }
}

.detail-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid $yp-line;

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }
}

.detail-views {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8125rem;
  color: $yp-muted;
}

// 分享
.detail-share {
  position: relative;
  z-index: 5;
  outline: none;

  &__menu {
    position: absolute;
    right: 0;
    top: calc(100% + 6px);
    min-width: 160px;
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
    cursor: pointer;

    &:hover {
      background: $yp-primary-soft;
      color: $yp-primary-ink;
    }
  }
}

// 內容區塊
.detail-section {
  min-width: 0;
  order: 4;

  &__title {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 12px;
  }
}

.detail-prose {
  white-space: pre-line;
  overflow-wrap: break-word;
}

.detail-tags {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid $yp-line;

  .yp-tag {
    font-size: 0.8125rem;
    padding: 4px 10px;

    &:hover {
      background: $yp-primary-soft;
      color: $yp-primary-ink;
    }
  }
}

.detail-map-link {
  display: inline-flex;
  align-items: flex-start;
  gap: 6px;
  font-weight: 500;

  svg {
    flex: none;
    margin-top: 4px;
    color: $yp-primary;
  }
}

// TipText 在手機排最後
:deep(.tip-text-wrapper) {
  order: 7;
}

// 側欄
.detail-aside {
  order: 3;
  min-width: 0;
}

.detail-claim {
  &__body {
    padding: 16px;
  }

  &__eyebrow {
    display: block;
    font-size: 0.75rem;
    font-weight: 500;
    color: $yp-muted;
    margin-bottom: 2px;
  }

  &__offer {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 500;
    line-height: 1.55;
    color: $yp-ink;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

// 票券樣式：左側票根放優惠值，虛線撕口分隔
.detail-ticket {
  position: relative;
  display: flex;
  align-items: stretch;
  border: 1px solid $yp-line;
  border-radius: $yp-radius;
  overflow: hidden;

  &__stub {
    position: relative;
    flex: 0 0 92px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 14px 8px;
    background: $yp-deal-soft;
    color: $yp-deal-ink;
    text-align: center;
    border-right: 1px dashed rgba($yp-deal, 0.45);

    &::before,
    &::after {
      content: '';
      position: absolute;
      right: -7px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: $yp-surface;
      border: 1px solid $yp-line;
    }

    &::before {
      top: -7px;
    }

    &::after {
      bottom: -7px;
    }
  }

  &__num {
    font-size: 1.75rem;
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.01em;
  }

  &__icon {
    font-size: 1.5rem;
  }

  &__unit {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  &__info {
    flex: 1;
    min-width: 0;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}

.detail-referral {
  padding: 16px 20px;
  border-top: 1px solid $yp-line;
  background: $yp-bg;

  &__store {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
    font-size: 0.9375rem;
    font-weight: 500;
  }

  &__ok {
    color: $yp-success;
    font-size: 18px;
  }

  .form-label {
    font-size: 0.8125rem;
    color: $yp-muted;
    margin-bottom: 4px;
  }
}

.detail-info-row {
  padding: 14px 20px 0;
  border-top: 1px solid $yp-line;
}

.detail-pass {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: $yp-radius;
  background: $yp-success-soft;
  color: #15803d;
  margin-bottom: 4px;

  svg {
    flex: none;
    margin-top: 2px;
    font-size: 20px;
  }

  div {
    display: flex;
    flex-direction: column;
    line-height: 1.4;
  }

  b {
    font-size: 1rem;
  }

  span {
    font-size: 0.8125rem;
    opacity: 0.85;
  }
}

.detail-amount {
  font-size: 0.875rem;
  color: $yp-muted;
  margin: 4px 0;

  b {
    font-size: 1.125rem;
    color: $yp-ink;
  }
}

.detail-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 20px 20px;

  .btn {
    min-height: 48px;
  }
}

.detail-login-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 2px 0 0;
  font-size: 0.8125rem;
  color: $yp-muted;

  svg {
    color: $yp-line-green;
    font-size: 16px;
  }
}

// 手機：領取操作固定在 Tab Bar 上方
@media (max-width: #{$yp-bp-lg - 1px}) {
  .detail-actions {
    position: fixed;
    left: 0;
    right: 0;
    bottom: calc(#{$yp-tabbar-h} + env(safe-area-inset-bottom));
    z-index: 1005;
    gap: 4px;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(8px);
    border-top: 1px solid $yp-line;
    box-shadow: 0 -10px 24px -18px rgba(19, 48, 58, 0.45);

    .btn {
      min-height: 46px;
    }
  }

  .detail-login-hint {
    font-size: 0.75rem;
  }
}

@media (min-width: $yp-bp-lg) {
  .detail-actions {
    border-top: 1px solid $yp-line;
    margin-top: 12px;
    padding-top: 16px;
  }
}
</style>
