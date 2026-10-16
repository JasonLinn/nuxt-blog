<template>
  <div class="coupon-info">
    <!-- 載入中 -->
    <div v-if="couponObject.pending" class="coupon-info__loading" aria-busy="true">
      <span class="yp-skeleton" style="height: 140px" />
      <span class="yp-skeleton" style="width: 60%; height: 22px" />
      <span class="yp-skeleton" style="width: 90%" />
    </div>
    <template v-else>
      <!-- 錯誤 -->
      <div v-if="couponObject.error" class="yp-empty yp-empty--error">
        <div class="yp-empty__icon"><Icon name="ri:error-warning-line" /></div>
        <p class="yp-empty__title">發生了一點錯誤</p>
        <p class="yp-empty__text mb-0">請稍後再嘗試。</p>
      </div>

      <div v-else-if="article" class="coupon-info__main">
        <div class="coupon-info__gallery">
          <Carousel>
            <Slide v-for="(img, index) in article.cover" :key="img">
              <img
                format="webp"
                :src="img.replace('https://yilanpass.com', '.')"
                :alt="`${article.title} 圖片 ${index + 1}`"
                class="coupon-info__img"
                quality="50"
                @click="showImg(index)"
              />
            </Slide>

            <template #addons="{ slidesCount }">
              <Navigation v-if="slidesCount > 1" />
              <Pagination v-if="slidesCount > 1" />
            </template>
          </Carousel>
          <VueEasyLightbox
            :visible="visibleRef"
            :imgs="article.cover"
            :index="indexRef"
            @hide="onHide"
          />
        </div>

        <div class="coupon-info__bar">
          <div
            class="coupon-info__share"
            tabindex="0"
            @click="isOpenShare = !isOpenShare"
            @blur="isOpenShare = false"
          >
            <span class="btn btn-soft btn-sm btn-icon"><Icon name="ri:share-line" />分享</span>
            <div v-show="isOpenShare" class="coupon-info__menu" @mousedown.prevent>
              <button type="button" class="coupon-info__menu-item" @click="shareCopy">
                <Icon name="ri:link" />複製連結
              </button>
              <button type="button" class="coupon-info__menu-item" @click="shareCoupon">
                <Icon name="ri:line-fill" />分享到 LINE
              </button>
            </div>
          </div>
          <NuxtLink
            v-if="userInfo?.id === 1"
            class="btn btn-sm btn-outline-primary btn-icon"
            :to="{ name: 'articles-edit', query: { id: route.params.id } }"
          >
            <Icon name="ri:edit-line" />編輯
          </NuxtLink>
        </div>

        <h2 class="coupon-info__title">{{ article.title }}</h2>

        <section class="coupon-info__block">
          <h3 class="coupon-info__label">優惠內容</h3>
          <div class="coupon-info__text">{{ article.content }}</div>
        </section>

        <section class="coupon-info__block">
          <h3 class="coupon-info__label">地址</h3>
          <a
            class="coupon-info__map"
            target="_blank"
            rel="noopener"
            :href="`https://www.google.com/maps/?q=${article.title} ${article.adress[0]}`"
          >
            <Icon name="ri:map-pin-2-fill" />{{ article.adress[0] }}
          </a>
        </section>

        <TipText />

        <div v-if="article.isReferral" class="coupon-info__referral">
          <div class="coupon-info__store">
            推薦店家：{{ referralStore?.name || '無' }}
            <Icon
              v-show="referralStore?.name"
              name="ri:checkbox-circle-fill"
              class="coupon-info__ok"
            />
          </div>
          <div class="input-group input-group-sm">
            <input
              v-model="referralCode"
              type="text"
              class="form-control"
              placeholder="輸入推薦代碼"
              aria-label="推薦代碼"
            />
            <button type="button" class="btn btn-outline-primary" @click="checkReferral">
              代入
            </button>
          </div>
        </div>
      </div>

      <div v-if="article">
        <!-- modal -->
        <div ref="modalRef" class="modal fade" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">輸入兌換序號</h5>
              </div>
              <div class="modal-body">
                <input v-model="hash" type="text" class="form-control" />
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-primary" @click="handleHashRecive">
                  確定
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- modal end -->

        <div class="coupon-info__actions">
          <div v-show="!article.isonce && !article.isReferral" class="coupon-info__pass">
            <Icon name="ri:checkbox-circle-fill" />出示即可使用
          </div>
          <div v-show="article.isReferral" class="coupon-info__amount">
            剩餘數量：<b class="yp-num">{{ article.amount }}</b>
          </div>
          <button
            v-show="article.isReferral && !isCheckReferral"
            type="button"
            class="btn btn-light w-100"
            disabled
          >
            請輸入推薦代碼
          </button>
          <!-- 領券按鈕 -->
          <button
            v-show="checkIsOnce() && article.isonce && isCheckReferral"
            type="button"
            class="btn btn-light w-100"
            disabled
          >
            每個帳號限領一次
          </button>
          <button
            v-show="article.amount && article.hash"
            type="button"
            class="btn btn-primary w-100"
            @click="showModal"
          >
            領取限量優惠券
          </button>
          <button
            v-show="article.amount && !article.hash && isCheckReferral && !checkIsOnce()"
            type="button"
            class="btn btn-primary w-100"
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
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
/* eslint-disable no-unused-vars, no-unreachable, eqeqeq, camelcase, n/handle-callback-err -- 保留既有領取 / LIFF 邏輯，本次只重構 UI */
import liff from '@line/liff'
import { index_liff_url } from '~/utils/static'
import useReferralStore from '~/store/referral'
import useCouponMapStore from '~~/store/couponMap'
import useStore from '~/store'
const route = useRoute()
const store = useStore()
const userData = computed(() => store.getUserData)
const userId = computed(() => store.getUserId)
const couponStore = useCouponMapStore()

const props = defineProps({
  couponId: {
    type: String,
    required: true
  }
})
const { couponId } = props

// const { $bootstrap } = useNuxtApp();
const modalRef = ref(null)
const referralCode = ref('')
const isOpenShare = ref(false)
const iconLoading = ref(false)
let modal
const hash = []
const liffUrl = 'https://liff.line.me/2005661804-zld9QenV/'
// const showModal = () => {
//   modal.show();
// };
/*  lightbox  */
const referralStore = ref(null)
const isCheckReferral = ref(false)
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

// onMounted(async () => {
//   modal = $bootstrap.modal(modalRef.value);
// });

// onBeforeUnmount(() => {
//   // 加上 dispose，避免切換頁面時或是 HMR 看到殘留畫面
//   modal.dispose();
// });

const couponObject = computed(() => couponStore.getCouponData)
const article = computed(() => couponObject.value.data.items.find((i) => i.id == couponId))
// article.value.referral = referralStore
//   if (error.value) {
//     console.log(error.value)
//     throw createError({ statusCode: 404 })
//   }
// console.log(article, 'aaaaaaaaarrrrrrrr', couponObject, couponObject.value.data.items)
const userInfo = useState('userInfo')

const checkIsOnce = () => {
  let wasGet = false
  const whiteList = []
  // 查詢該帳號是否領過
  wasGet = userData?.value?.coupons.some((cup) => {
    return JSON.parse(cup).id == article.value.id
  })
  return wasGet && article.value.isonce
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
      alert('請輸入推薦代碼')
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
    alert('成功代入: ' + referralStore.value.name)
  } catch (error) {
    console.error('檢查推薦代碼時發生錯誤:', error)

    // 根据错误状态码显示不同的错误信息
    if (error.response?.status === 404) {
      alert('無效的推薦代碼')
    } else if (error.response?.status === 400) {
      alert('請輸入推薦代碼')
    } else {
      alert('系統錯誤，請稍後再試')
    }

    referralStore.value = null
    isCheckReferral.value = false
  }
}

const handleHashRecive = () => {
  const articleHash = article.value.hash
  const index = articleHash.findIndex((i) => hash == i)

  if (index >= 0) {
    getCupon()
    alert('序號正確')
    modal.hide()
  } else {
    alert('序號錯誤')
  }
}

const getCupon = async () => {
  if (iconLoading.value) return
  if (!userId.value) {
    alert('請先登入')
    await navigateTo(`/api/line/login?returnTo=${encodeURIComponent(route.path)}`, {
      external: true
    })
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
  navigator.clipboard.writeText(index_liff_url + route.path)
  window?.alert('已複製連結!')
}
const shareCoupon = () => {
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

useHead({
  title: article.value.title
})

const description = article.value.content.replace(/\n/g, ' ').substring(0, 300)
const { origin } = useRequestURL()
const { baseURL } = useRuntimeConfig().app

useSeoMeta({
  description,
  ogTitle: article.value.title,
  ogDescription: description,
  ogImage: article.value.cover[0],
  ogUrl: () => `${origin}${baseURL}/articles/${article.value.id}`,
  twitterTitle: article.value.title,
  twitterDescription: description,
  twitterImage: article.value.cover[0],
  twitterUrl: () => `${origin}${baseURL}/articles/${article.value.id}`,
  twitterCard: 'summary_large_image'
})
</script>

<style scoped lang="scss">
.coupon-info {
  width: 100%;

  &__loading {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__gallery {
    border-radius: $yp-radius;
    overflow: hidden;
    background: $yp-surface-2;

    :deep(.carousel__slide) {
      height: 180px !important;
    }
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    cursor: zoom-in;
  }

  &__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__share {
    position: relative;
    z-index: 2;
    outline: none;
  }

  &__menu {
    position: absolute;
    left: 0;
    top: calc(100% + 6px);
    min-width: 150px;
    padding: 6px;
    background: $yp-surface;
    border: 1px solid $yp-line;
    border-radius: $yp-radius;
    box-shadow: $yp-shadow-lg;
  }

  &__menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 9px 10px;
    border: 0;
    border-radius: $yp-radius-sm;
    background: transparent;
    color: $yp-ink;
    font-size: 0.9375rem;
    text-align: left;

    &:hover {
      background: $yp-primary-soft;
      color: $yp-primary-ink;
    }
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.4;
    margin: 0;
    word-break: break-word;
  }

  &__block {
    padding: 12px 14px;
    background: $yp-bg;
    border-radius: $yp-radius;
  }

  &__label {
    font-size: 0.8125rem;
    font-weight: 700;
    color: $yp-muted;
    margin: 0 0 4px;
  }

  &__text {
    font-size: 0.9375rem;
    line-height: 1.7;
    white-space: pre-line;
    overflow-wrap: break-word;
  }

  &__map {
    display: inline-flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 0.9375rem;
    font-weight: 500;

    svg {
      flex: none;
      margin-top: 4px;
      color: $yp-primary;
    }
  }

  &__referral {
    padding: 12px 14px;
    border: 1px solid $yp-line;
    border-radius: $yp-radius;
  }

  &__store {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    font-size: 0.9375rem;
    font-weight: 500;
  }

  &__ok {
    color: $yp-success;
    font-size: 18px;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }

  &__pass {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    align-self: flex-start;
    padding: 6px 12px;
    border-radius: $yp-radius-pill;
    background: $yp-success-soft;
    color: #15803d;
    font-size: 0.875rem;
    font-weight: 700;
  }

  &__amount {
    font-size: 0.875rem;
    color: $yp-muted;

    b {
      font-size: 1.125rem;
      color: $yp-ink;
    }
  }
}
</style>
