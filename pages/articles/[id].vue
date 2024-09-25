<template>
  <div class="container col-12">
    <div v-if="pending">
      <Icon class="h-6 w-6 text-gray-500" name="eos-icons:loading" />
    </div>
    <template v-else>
      <div v-if="error" class="my-4">
        <span class="text-gray-500">發生了一點錯誤，請稍後再嘗試</span>
        <p class="my-2 text-rose-500">{{ error }}</p>
      </div>
      <div v-else-if="article" class="mb-8 flex w-full flex-col justify-center md:max-w-3xl">
        <!-- <div class="mt-4 flex justify-center">
          <img :src="article.cover" class="cupon-img" />
        </div> -->
        <Carousel>
          <Slide v-for="img in article.cover" :key="img">
            <img :src="img" class="cupon-img" />
          </Slide>

          <template #addons="{ slidesCount }">
            <Navigation v-if="slidesCount > 1" />
            <Pagination v-if="slidesCount > 1" />
          </template>
        </Carousel>
        <div class="cupon-time my-2 flex flex-col justify-between sm:my-0 sm:flex-row sm:items-center">
          <!-- <time class="my-2 text-sm text-gray-400">
            {{ new Date(article.updated_at).toLocaleString('zh-TW') }}
          </time> -->
          <div class="cupon-share">
            <svg @click="isOpenShare = !isOpenShare" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-share-fill cupon-share-icon" viewBox="0 0 16 16">
              <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5"/>
            </svg>
            <div class="cupon-share-list" v-show="isOpenShare">
                <svg @click="shareCopy" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 16">
                  <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
                </svg>
                <svg @click="shareCoupon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-up-right cupon-share-icon" viewBox="0 0 16 16">
                  <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"/>
                  <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"/>
                </svg>
            </div>
          </div>
          <div v-if="userInfo?.id === 1" class="flex-rowx flex gap-3">
            <NuxtLink
              class="flex items-center text-sm text-gray-400 hover:font-semibold hover:text-emerald-500"
              :to="{
                name: 'articles-edit',
                query: {
                  id: route.params.id
                }
              }"
            >
              <Icon class="mr-1 h-4 w-4" name="ri:edit-line" />
              編輯
            </NuxtLink>
            <button
              class="flex items-center text-sm text-gray-400 hover:font-semibold hover:text-rose-500"
              @click="handleDeleteArticle"
            >
              <Icon class="mr-1 h-4 w-4" name="ri:delete-bin-line" />
              刪除
            </button>
          </div>
        </div>
        <h1 class="cupon-title break-words text-4xl font-semibold text-gray-700">
          {{ article.title }}
        </h1>
        <div class="cupon-text">
          {{ article.content }}
        </div>
        <div class="cupon-referral">推薦店家: {{ referralStore?.name || `無` }}
          <svg v-show="referralStore?.name" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
          </svg>
        </div>
        <div v-if="article.isReferral">
          輸入推薦代碼:
          <input type="text" class="fererral-input" v-model="referralCode">
          <div class="btn fererral-comfirm" @click="checkReferral">代入</div>
        </div>
        <div class="cupon-amount">
          剩餘數量: {{ article.amount }}
        </div>
      </div>
      <div>
      <!-- modal -->
      <div class="modal fade" tabindex="-1" ref="modalRef">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              輸入兌換序號
            </div>
            <div class="modal-body">
              <input type="text" v-model="hash">
            </div>
            <div class="modal-footer">
              <button type="button" @click="handleHashRecive">確定</button>
            </div>
          </div>
        </div>
      </div>
      <!-- modal end -->
      <button v-show="article.isReferral && !isCheckReferral" type="button" class="btn btn-light">
        請輸入推薦代碼
      </button>
      <button v-show="article.amount && article.hash[0]" type="button" class="btn btn-success" @click="showModal">
        領取限量優惠券
      </button>
      <button v-show="article.amount && !article.hash[0] && !article.isReferral || isCheckReferral" type="button" class="btn btn-success" @click="getCupon">
        領取優惠券
      </button>
    </div>
    </template>
  </div>
</template>
<style scoped>
.cupon-text {
  overflow-wrap: break-word;
  margin-bottom: 30px;
  white-space: pre-line;
}
.cupon-img {
  max-width: 100%;
}
.cupon-time {
  display: flex;
  justify-content: flex-end;
}
.cupon-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  position: relative;
}
.cupon-share {
  position: relative;
  z-index: 1;
}
.cupon-share-icon {
}
.cupon-share-list {
  width: 80px;
  background-color: #c9e0f6;
  position: absolute;
  right: 0;
  bottom: -35px;
  padding: 10px;
  border-radius: 40px;
  display: flex;
  justify-content: space-around;
}
.cupon-amount {
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}
.cupon-referral {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.cupon-referral > svg {
  color: #00b4ff;
  margin-left: 5px;
}
.fererral-input{
  width: 100px;
}
.fererral-comfirm {
  /* height: 24px; */
  font-size: 12px;
  color: #fff;
  padding: 3px;
  margin-left: 15px;
  background-color: #ff9742;
}
.carousel__slide {
  max-height: 180px;
}
</style>

<script setup>
import liff from "@line/liff";
import useReferralStore from "~/store/referral";
import { referral } from "~/utils/referral"
import { index_liff_url } from "/utils/static"
const { $bootstrap } = useNuxtApp();
const modalRef = ref(null);
const referralCode = ref('');
const isOpenShare = ref(false)
let modal;
let hash = []
const liffUrl = 'https://liff.line.me/2005661804-zld9QenV/'
const showModal = () => {
  modal.show();
};
const store = useReferralStore()
let referralStore = ref(null)
let isCheckReferral = ref(false)
// const referralStore = referral.find((ref) => {
//   if (!store.getReferral?.referral) {
//     return null
//   }
//   console.log(ref, store.getReferral.referral)
//   return ref.code == store.getReferral.referral
// })


onMounted(async () => {
  modal = $bootstrap.modal(modalRef.value);
});

onBeforeUnmount(() => {
  // 加上 dispose，避免切換頁面時或是 HMR 看到殘留畫面
  modal.dispose();
});

const route = useRoute()

const { pending, data: article, error } = await useFetch(`/api/articles/${route.params.id}`)
// article.value.referral = referralStore
if (error.value) {
  console.log(error.value)
  throw createError({ statusCode: 404 })
}

const userInfo = useState('userInfo')

const handleDeleteArticle = () => {
  const answer = confirm('你確定要刪除優惠券嗎？')

  if (answer) {
    $fetch(`/api/articles/${route.params.id}`, {
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
          amount: article.value.amount -1
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
          user: profile,
        }
    })
    .then((response) => {
    })
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
  let articleHash = article.value.hash
  let index = articleHash.findIndex((i) =>hash == i)

  console.log(article,'cccc', articleHash, index)
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
  // let checkIcon = referralStore?.value?.name ? "https://nuxt-blog-swart.vercel.app/icon/check-circle-fill.svg" : "";
  let cupon = {
        "type": "bubble",
        "size": "giga",
        "hero": {
          "type": "image",
          "url": article.value.cover[0],
          "size": "full",
          "aspectRatio": "20:10",
          "aspectMode": "cover",
          "action": {
            "type": "uri",
            "uri": liffUrl + 'articles/' +article.value.id
          }
        },
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": article.value.title,
              "weight": "bold",
              "size": "xl",
              "action": {
                "type": "uri",
                "uri": liffUrl + 'articles/' +article.value.id
              }
            },
            //隱藏無用星星
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
              "type": "box",
              "layout": "vertical",
              "margin": "lg",
              "spacing": "sm",
              "action": {
                "type": "uri",
                "uri": liffUrl + 'articles/' +article.value.id
              },
              "contents": [{
                  "type": "box",
                  "layout": "baseline",
                  "spacing": "sm",
                  "contents": [
                    {
                      "type": "text",
                      "text": "推薦店家",
                      "color": "#aaaaaa",
                      "size": "sm",
                      "flex": 2
                    },
                    {
                      "type": "text",
                      "text": referralStore?.value?.name || '無' ,
                      "wrap": true,
                      "color": "#666666",
                      "size": "sm",
                      "flex": 5
                    }
                  ]
                },{
                  "type": "box",
                  "layout": "baseline",
                  "spacing": "sm",
                  "paddingBottom": "md",
                  "contents": [
                    {
                      "type": "text",
                      "text": "序號",
                      "color": "#aaaaaa",
                      "size": "sm",
                      "flex": 2
                    },
                    {
                      "type": "text",
                      "text": article.value.hash[0] || '無序號' ,
                      "wrap": true,
                      "color": "#666666",
                      "size": "sm",
                      "flex": 5
                    },
                    {
                      "type": "icon",
                      "size": "xl",
                      "url": "https://nuxt-blog-swart.vercel.app/one_text.png",
                      "position": "absolute",
                      "offsetEnd": "10px",
                      "offsetBottom": "3px"
                    },
                  ]
                },
                {
                  "type": "separator"
                },
                {
                  "type": "box",
                  "layout": "baseline",
                  "spacing": "sm",
                  "paddingTop": "md",
                  "contents": [
                    // {
                    //   "type": "text",
                    //   "text": "說明",
                    //   "color": "#aaaaaa",
                    //   "size": "sm",
                    //   "flex": 2
                    // },
                    {
                      "type": "text",
                      "text": article.value.content,
                      "wrap": true,
                      "color": "#666666",
                      "size": "sm",
                      "flex": 5
                    }
                  ]
                }
              ]
            }
          ]
        },
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

      liff.sendMessages([
      {
        "type": "flex",
        "altText": '優惠券-'+article.value.title,
        "contents": cupon
      }
      ])
      .then(res => {
        window.alert('成功領取優惠券!')
        liff.getProfile().then(profile => {
          if (!liff.isLoggedIn()) {
            return;
          }
          patchUser(profile)
        })
        sendPatch()
      })
      .catch(error => window.alert('未登入LINE帳號'+ error));
}
const shareCopy = () => {
  navigator.clipboard.writeText(index_liff_url + route.path);
  window.alert('已複製連結!')
}
const shareCoupon = () => {
  liff
  .shareTargetPicker(
    [{
    "type": "flex",
    "altText": "宜蘭旅遊通-優惠券",
    "contents":
    {
  "type": "bubble",
  "header": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "box",
        "layout": "horizontal",
        "contents": [
          {
            "type": "image",
            "url": article.value.cover[0],
            "size": "full",
            "aspectMode": "cover",
            "aspectRatio": "2:1",
            "gravity": "center",
            "flex": 1
          },
          {
            "type": "box",
            "layout": "horizontal",
            "contents": [
              {
                "type": "text",
                "text": "推薦",
                "size": "xs",
                "color": "#ffffff",
                "align": "center",
                "gravity": "center"
              }
            ],
            "backgroundColor": "#EC3D44",
            "paddingAll": "2px",
            "paddingStart": "4px",
            "paddingEnd": "4px",
            "flex": 0,
            "position": "absolute",
            "offsetStart": "18px",
            "offsetTop": "18px",
            "cornerRadius": "100px",
            "width": "48px",
            "height": "25px"
          }
        ]
      }
    ],
    "paddingAll": "0px"
  },
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "text",
                "contents": [],
                "size": "xl",
                "wrap": true,
                "text": article.value.title,
                "color": "#ffffff",
                "weight": "bold"
              },
              // {
              //   "type": "text",
              //   "text": "3 Bedrooms, ¥35,000",
              //   "color": "#ffffffcc",
              //   "size": "sm"
              // }
            ],
            "spacing": "sm"
          },
          {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "box",
                "layout": "vertical",
                "contents": [
                  {
                    "type": "text",
                    "contents": [],
                    "size": "sm",
                    "wrap": true,
                    "margin": "lg",
                    "color": "#ffffffde",
                    "text": article.value.content
                  }
                ],
                "maxHeight": "150px"
              }
            ],
            "paddingAll": "13px",
            "backgroundColor": "#ffffff1A",
            "cornerRadius": "2px",
            "margin": "xl"
          }
        ]
      }
    ],
    "paddingAll": "20px",
    "backgroundColor": "#464F69"
  },
  "action": {
    "type": "uri",
    "label": "action",
    "uri": liffUrl + 'articles/' +article.value.id
  }
}
}],
    {
      isMultiple: true,
    }
  )
  .then(function (res) {
    if (res) {
      // succeeded in sending a message through TargetPicker
      console.log(`[${res.status}] Message sent!`);
    } else {
      // sending message canceled
      console.log("TargetPicker was closed!");
    }
  })
  .catch(function (error) {
    // something went wrong before sending a message
    console.log("something wrong happen");
  });
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
