<template>
  <div class="yp-page">
    <!-- 載入中 -->
    <div v-if="pending" class="shop-loading">
      <span class="yp-skeleton" style="width: 40%; height: 18px; margin-bottom: 16px" />
      <span class="yp-skeleton shop-loading__media" />
      <span class="yp-skeleton" style="width: 60%; height: 32px; margin: 20px 0 12px" />
      <span class="yp-skeleton" style="width: 90%" />
    </div>

    <template v-else>
      <!-- 錯誤 -->
      <div v-if="error" class="yp-card yp-empty yp-empty--error">
        <div class="yp-empty__icon"><Icon name="ri:error-warning-line" /></div>
        <p class="yp-empty__title">發生了一點錯誤</p>
        <p class="yp-empty__text">請稍後再嘗試。</p>
        <NuxtLink to="/relative" class="btn btn-primary">回代訂服務</NuxtLink>
      </div>

      <template v-else-if="article">
        <nav class="yp-breadcrumb" aria-label="breadcrumb">
          <NuxtLink to="/">首頁</NuxtLink>
          <NuxtLink to="/relative">代訂服務</NuxtLink>
          <span>{{ article.title }}</span>
        </nav>

        <div class="yp-detail">
          <!-- 主內容 -->
          <div class="shop-main">
            <div class="shop-gallery">
              <Carousel v-if="article.cover?.length">
                <Slide v-for="(img, index) in article.cover" :key="img">
                  <img
                    :src="img"
                    :alt="article.title"
                    class="shop-gallery__img"
                    @click="showImg(index)"
                  />
                </Slide>

                <template #addons="{ slidesCount }">
                  <Navigation v-if="slidesCount > 1" />
                  <Pagination v-if="slidesCount > 1" />
                </template>
              </Carousel>
            </div>
            <VueEasyLightbox
              :visible="visibleRef"
              :imgs="article.cover"
              :index="indexRef"
              @hide="onHide"
            />

            <header class="shop-head">
              <h1 class="shop-head__title">{{ article.title }}</h1>
            </header>

            <div class="yp-card yp-card__section">
              <div
                class="shop-content yp-prose"
                v-html="sanitizeRichContent(article.content)"
              ></div>
            </div>
          </div>

          <!-- 側欄：預約 / 分享 / 管理 -->
          <aside class="yp-detail__aside shop-aside">
            <RelativeFooter />

            <div class="yp-card yp-card__section shop-share">
              <h2 class="shop-share__title">分享給朋友</h2>
              <div class="d-flex flex-wrap gap-2">
                <button type="button" class="btn btn-soft btn-icon" @click="shareCopy">
                  <Icon name="ri:file-copy-line" />複製連結
                </button>
                <button type="button" class="btn btn-outline-primary btn-icon" @click="shareCoupon">
                  <Icon name="ri:share-forward-line" />LINE 分享
                </button>
              </div>
            </div>

            <div v-if="userInfo?.id === 1" class="yp-card yp-card__section shop-admin">
              <h2 class="shop-share__title">管理</h2>
              <div class="d-flex flex-wrap gap-2">
                <NuxtLink
                  class="btn btn-soft btn-icon"
                  :to="{
                    name: 'relative_shop-edit',
                    query: {
                      id: route.params.id
                    }
                  }"
                >
                  <Icon name="ri:edit-line" />編輯
                </NuxtLink>
                <button
                  type="button"
                  class="btn btn-outline-danger btn-icon"
                  @click="handleDeleteArticle"
                >
                  <Icon name="ri:delete-bin-line" />刪除
                </button>
              </div>
            </div>
          </aside>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
/* eslint-disable no-unused-vars, eqeqeq, n/handle-callback-err -- 既有業務邏輯（保留未使用的優惠券相關函式），本次僅重構版面 */
import liff from '@line/liff'
import { sanitizeRichContent } from '~/utils/rich-content.js'
import useReferralStore from '~/store/referral'
import { referral } from '~/utils/referral'
// import { RelativeFooter } from "@/components/RelativeFooter.vue";
const { $bootstrap } = useNuxtApp()
const modalRef = ref(null)
const referralCode = ref('')
const isOpenShare = ref(false)
const visibleRef = ref(false)
const indexRef = ref(0)
let modal
const hash = []
const liffUrl = 'https://yilanpass.com'
const showModal = () => {
  modal.show()
}
const showImg = (index) => {
  indexRef.value = index
  visibleRef.value = true
}
const onHide = () => (visibleRef.value = false)
const store = useReferralStore()
const referralStore = ref(null)
const isCheckReferral = ref(false)
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

const route = useRoute()

const { pending, data: article, error } = await useFetch(`/api/relative/${route.params.id}`)
// article.value.referral = referralStore
if (error.value) {
  console.log(error.value)
  throw createError({ statusCode: 404 })
}

const userInfo = useState('userInfo')

const handleDeleteArticle = () => {
  const answer = confirm('你確定要刪除代訂服務嗎？')

  if (answer) {
    $fetch(`/api/relative/${route.params.id}`, {
      method: 'DELETE'
    })
      .then(() => {
        navigateTo('/')
      })
      .catch((error) => {
        console.error(error)
        alert(error)
      })
  }
}

const sendPatch = async () => {
  await $fetch(`/api/cupon`, {
    method: 'PATCH',
    body: {
      id: route.params.id,
      amount: article.value.amount - 1
    }
  })
    .then((response) => {
      article.value.amount = response.amount
    })
    .catch((error) => alert(error))
}

const patchUser = async (profile) => {
  article.value.referral = referralStore.value

  await $fetch(`/api/user/coupon`, {
    method: 'PATCH',
    body: {
      coupon: article.value,
      user: profile
    }
  })
    .then((response) => {})
    .catch((error) => alert(error))
}

const checkReferral = () => {
  referralStore.value = referral.find((ref) => {
    return ref.code == referralCode.value
  })
  console.log(referralStore.value, 'ssss')
  if (referralStore?.value) {
    isCheckReferral.value = true
    alert('成功代入:' + referralStore?.value?.name)
  } else {
    alert('代碼錯誤')
  }
}

const handleHashRecive = () => {
  const articleHash = article.value.hash
  const index = articleHash.findIndex((i) => hash == i)

  console.log(article, 'cccc', articleHash, index)
  if (index >= 0) {
    getCupon()
    alert('序號正確')
    modal.hide()
  } else {
    alert('序號錯誤')
  }
}

const getCupon = () => {
  // if (!liff.isLoggedIn()) {
  //   return;
  // }
  console.log(article, referralStore, 'aaaa')
  const cupon = {
    type: 'bubble',
    size: 'giga',
    hero: {
      type: 'image',
      url: article.value.cover,
      size: 'full',
      aspectRatio: '20:10',
      aspectMode: 'cover',
      action: {
        type: 'uri',
        uri: liffUrl + '/relative_shop/' + article.value.id
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
            uri: liffUrl + '/relative_shop/' + article.value.id
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
            uri: liffUrl + '/relative_shop/' + article.value.id
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
                  size: 'xxl',
                  url: 'https://yilanpass.com/one_text.png',
                  position: 'absolute',
                  offsetEnd: '10px'
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
  navigator.clipboard.writeText(liffUrl + route.path)
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
              uri: liffUrl + '/relative_shop/' + article.value.id
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
// func end

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
  ogImage: article.value.cover,
  ogUrl: () => `${origin}${baseURL}/relative-store/${article.value.id}`,
  twitterTitle: article.value.title,
  twitterDescription: description,
  twitterImage: article.value.cover,
  twitterUrl: () => `${origin}${baseURL}/relative-store/${article.value.id}`,
  twitterCard: 'summary_large_image'
})
</script>

<style scoped lang="scss">
.shop-loading {
  &__media {
    aspect-ratio: 16 / 9;
    border-radius: $yp-radius-lg;
  }
}

.shop-main {
  min-width: 0;
}

.shop-gallery {
  border-radius: $yp-radius-lg;
  overflow: hidden;
  background: $yp-surface-2;
  box-shadow: $yp-shadow;

  &__img {
    display: block;
    width: 100%;
    max-height: 480px;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    cursor: zoom-in;
  }
}

.shop-head {
  margin: 20px 0 16px;

  &__title {
    font-size: 1.625rem;
    font-weight: 700;
    line-height: 1.35;
    margin: 0;
    overflow-wrap: anywhere;

    @media (min-width: $yp-bp-md) {
      font-size: 2rem;
    }
  }
}

.shop-content {
  white-space: pre-wrap;

  :deep(strong) {
    font-weight: 700;
  }

  :deep(ol) {
    list-style: decimal;
    padding-left: 1.5em;
  }

  :deep(ul) {
    list-style: disc;
    padding-left: 1.5em;
  }

  :deep(blockquote) {
    border-left: 3px solid $yp-line;
    padding-left: 1em;
    margin-left: 0;
    color: $yp-muted;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
  }
}

.shop-aside {
  display: flex;
  flex-direction: column;
  gap: 16px;

  :deep(.relative-footer) {
    margin-top: 0;
  }
}

.shop-share {
  &__title {
    font-size: 1rem;
    font-weight: 700;
    margin: 0 0 12px;
  }
}
</style>
