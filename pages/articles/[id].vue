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
        <!-- 麵包屑 -->
        <nav class="mb-4 text-sm">
          <div class="flex items-center gap-2 text-gray-500">
            <NuxtLink to="/" class="hover:text-blue-600">首頁</NuxtLink>
            <span class="text-gray-400">/</span>
            <span class="text-gray-700">{{ article.title }}</span>
          </div>
        </nav>
        <!-- <div class="mt-4 flex justify-center">
          <img :src="article.cover" class="cupon-img" />
        </div> -->
        <Carousel>
          <Slide v-for="(img, index) in article.cover" :key="img">
            <img
              :src="img"
              class="cupon-img"
              @click="showImg(index)"
              quality="50"
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
        <div class="cupon-time my-2 flex flex-col justify-between sm:my-0 sm:flex-row sm:items-center">
          <!-- <time class="my-2 text-sm text-gray-400">
            {{ new Date(article.updated_at).toLocaleString('zh-TW') }}
          </time> -->
          <div class="cupon-share" tabindex="0" @click="isOpenShare = !isOpenShare" @blur="isOpenShare = false">
            <svg  xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-share-fill cupon-share-icon" viewBox="0 0 16 16">
              <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5"/>
            </svg>
            <div class="cupon-share-list" v-show="isOpenShare" >
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
          【優惠內容】<div>{{ article.content }}</div>
        </div>
        <div v-if="article.tags" class="cupon-tags">
          【標籤】{{ article.tags }}
        </div>
        <div class="cupon-map">
          【Google地圖】相關產品資訊可點選：<a target="_blank" :href="`https://www.google.com/maps/?q=${article.title} ${article.adress[0]}`">{{article.adress[0]}}</a>
        </div>
        <TipText></TipText>
        <div class="cupon-referral" v-if="article.isReferral">推薦店家: {{ referralStore?.name || `無` }}
          <svg v-show="referralStore?.name" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
          </svg>
        </div>
        <div class="cupon-code" v-if="article.isReferral">
          輸入推薦代碼:
          <input type="text" class="fererral-input" v-model="referralCode">
          <div class="btn fererral-comfirm" @click="checkReferral">代入</div>
        </div>
      </div>
      <div>
       <div class="coupon-pass" v-show="!article.isonce && !article.isReferral">出示即可使用</div>
       <div>
          <div class="cupon-amount" v-show="article.isReferral || article.isonce">
            剩餘數量: {{ article.amount }}
          </div>
         <button v-show="article.isReferral && !isCheckReferral" type="button" class="btn btn-light">
           請輸入推薦代碼
         </button>
         <!-- 只能領一次  需推薦碼 -->
         <button v-show="checkIsOnce() && article.isonce && isCheckReferral" type="button" class="btn btn-light">
           每個帳號限領一次
         </button>
         <!-- 只能領一次  並且不用推薦碼 -->
         <button v-show="checkIsOnce() && article.isonce && !isCheckReferral" type="button" class="btn btn-light">
           每個帳號限領一次
         </button>
         <button v-show="article.amount && article.hash && isCheckReferral && !checkIsOnce()" type="button" class="btn btn-success" @click="handleHashRecive">
           領取限量優惠券
         </button>
         <!-- 限量優惠券  需推薦碼 -->
         <button v-show="article.amount && !article.hash && isCheckReferral && !checkIsOnce()" type="button" class="btn btn-success" @click="getCupon">
           領取優惠券
           <Icon v-show="iconLoading" class="h-6 w-6 text-gray-500" name="eos-icons:loading" />
         </button>
         <!-- 限量優惠券  並且不用推薦碼 -->
         <button v-show="article.amount && article.hash && !isCheckReferral && !checkIsOnce()" type="button" class="btn btn-success" @click="handleHashRecive">
           領取限量優惠券
         </button>
       </div>

       <!-- 條碼顯示區域 -->
       <!-- <div v-if="showQRCode" class="barcode-container">
         <canvas id="barcode"></canvas>
         <div class="hash-number mt-3">
           序號：{{ qrCodeData }}
         </div>
       </div> -->
    </div>
    </template>
  </div>
</template>

<script setup>
import liff from "@line/liff";
import useReferralStore from "~/store/referral";
import useStore from "~/store";
import { index_liff_url } from "/utils/static"
import { onMounted, onBeforeUnmount } from 'vue'
import { defineAsyncComponent } from 'vue'

const route = useRoute()
const store = useStore()
const userData = computed(()=> store.getUserData)
const userId = computed(()=> store.getUserId)

// const { $bootstrap } = useNuxtApp();
const modalRef = ref(null);
const referralCode = ref('');
const isOpenShare = ref(false)
let iconLoading = ref(false)
let modal = null;
const showQRCode = ref(false)
const qrCodeData = ref('')
let hash = []
const liffUrl = 'https://liff.line.me/2005661804-zld9QenV/'

/*  lightbox  */
let referralStore = ref(null)
let isCheckReferral = ref(false)
const visibleRef = ref(false);
const indexRef = ref(0);

const imgs = [
  "https://via.placeholder.com/450.png/",
  "https://via.placeholder.com/300.png/",
  "https://via.placeholder.com/150.png/",
  { src: "https://via.placeholder.com/450.png/", title: "this is title" },
];

const showImg = (index) => {
  indexRef.value = index;
  visibleRef.value = true;
};
const onHide = () => (visibleRef.value = false);
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
    import('bootstrap/dist/js/bootstrap.bundle').then((bootstrap) => {
      modal = new bootstrap.default.Modal(modalRef.value);
    }).catch(error => {
      console.error('無法加載 Bootstrap:', error);
    });
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

const { pending, data: article, error } = await useFetch(`/api/articles/${route.params.id}`)
// article.value.referral = referralStore
if (error.value) {
  console.log(error.value)
  throw createError({ statusCode: 404 })
}

const userInfo = useState('userInfo')

const checkIsOnce = () => {
  let wasGet = false
  const whiteList = []
  // 查詢該帳號是否領過
  wasGet = userData?.value?.coupons.some((cup)=> {
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

const handleDeleteArticle = () => {
  if (!process.client) return;
  if (!article.value) {
    console.log('無法刪除，article 不存在')
    return
  }
  const answer = confirm('你確定要刪除優惠券嗎？')

  if (answer) {
    $fetch(`/api/articles/${route.params.id}`, {
      method: 'DELETE'
    })
      .then(() => {
        navigateTo('/')
      })
      .catch((error) => {
        console.log(error)
      })
  }
}

const sendPatch = async () => {
  if (!article.value || typeof article.value.amount !== 'number') {
    console.log('article.value 或 amount 無效', article.value)
    return
  }
  await $fetch(`/api/cupon`, {
      method: 'PATCH',
        body: {
          id: route.params.id,
          amount: article.value.amount -1
        }
    })
    .then((response) => {
      if (response && typeof response.amount === 'number') {
        article.value.amount = response.amount
      } else {
        console.log('PATCH 回傳 amount 無效', response)
      }
    })
    .catch((error) => {
      if (process.client) console.log(error)
    })
}

const patchUser = async (profile) => {
  if (!article.value) {
    console.log('patchUser: article 不存在')
    return
  }
  // 設定推薦店家
  article.value.referral = referralStore.value
  //增加領取時間
  article.value.gotTime = new Date()
  //增加條碼數據
  article.value.qrCodeData = qrCodeData.value
  //暫時填進已領優惠券
  if (userData?.value?.coupons && Array.isArray(userData.value.coupons)) {
    userData.value.coupons.push(JSON.stringify(article.value))
  } else {
    console.log('userData.value.coupons 無效', userData.value)
  }
  store.setUser(userData)
  //打API更新資料庫
  await $fetch(`/api/user/appendCoupon`, {
      method: 'PATCH',
        body: {
          coupon: article.value,
          user: profile,
        }
    })
    .then((response) => {
      if (process.client) alert('領取成功!')
      navigateTo('/userInfo')
    })
    .catch((error) => {
      if (process.client) console.log(error)
    })
}

const checkReferral = async () => {
  try {
    if (!referralCode.value) {
      if (process.client) alert('請輸入推薦代碼');
      return;
    }

    const response = await $fetch('/api/referral', {
      method: 'POST',
      body: {
        code: referralCode.value
      }
    });

    referralStore.value = response.data;
    isCheckReferral.value = true;
    if (process.client) alert('成功代入: ' + referralStore.value.name);

  } catch (error) {
    console.error('檢查推薦代碼時發生錯誤:', error);
    
    // 根据错误状态码显示不同的错误信息
    if (process.client) {
      if (error.response?.status === 404) {
        alert('無效的推薦代碼');
      } else if (error.response?.status === 400) {
        alert('請輸入推薦代碼');
      } else {
        alert('系統錯誤，請稍後再試');
      }
    }
    
    referralStore.value = null;
    isCheckReferral.value = false;
  }
};

// 添加新的條碼生成函數
const generateBarcode = async (canvas, text) => {
  // 確保在客戶端環境並且 document 存在
  if (process.client && typeof document !== 'undefined' && canvas) {
    try {
      const JsBarcode = (await import('jsbarcode')).default;
      JsBarcode(canvas, text, {
        format: "CODE128",
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 20,
        margin: 10
      });
    } catch (error) {
      console.error('生成條碼錯誤:', error);
    }
  }
}

// 添加一個函數來生成 LINE 登錄 URL
const getLineLoginUrl = (state) => {
  if (!process.client || typeof window === 'undefined') return '';
  
  // 獲取當前的 URL 協議和主機名
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const baseUrl = `${protocol}//${hostname}${port}`;
  
  // 構建完整的回調 URL
  const redirectUri = encodeURIComponent(`${baseUrl}/line_callback`);
  
  return `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=2005661804&redirect_uri=${redirectUri}&state=${state}&bot_prompt=normal&scope=openid%20email%20profile`;
};

const handleHashRecive = async () => {
  try {
    // 檢查是否已登入
    if (!userId.value) {
      if (process.client) {
        alert("請先登入");
        hideModal();
        // 使用函數生成 LINE 登錄 URL
        navigateTo(getLineLoginUrl(route.path), { external: true });
      }
      return;
    }

    // 從 API 獲取一組數字
    const response = await $fetch('/api/hash/generate', {
      method: 'POST',
      body: {
        articleId: route.params.id
      }
    })

    qrCodeData.value = response.hash
    showQRCode.value = true
    
    // 確保只在客戶端生成條碼
    if (process.client) {
      // 在下一個 tick 生成條碼
      nextTick(async () => {
        // 確保 document 存在
        if (typeof document !== 'undefined') {
          const canvas = document.getElementById('barcode')
          if (canvas) {
            await generateBarcode(canvas, qrCodeData.value)
          }
        }
      })
    }

    // 更新用戶優惠券資訊
    await patchUser(userData.value)
    await sendPatch()

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
  iconLoading = true

  if (!userId.value) {
    if (process.client) {
      alert("請先登入");
      // 使用函數生成 LINE 登錄 URL
      navigateTo(getLineLoginUrl(route.path), { external: true });
    }
    return
  }

  if (userId.value) {
    await patchUser(userData.value)
    await sendPatch()
  } else if (process.client) {
    await liff.getProfile().then(profile => {
      patchUser(profile)
    })
    await sendPatch()
  }

  return
  // let checkIcon = referralStore?.value?.name ? "https://yilanpass.com/icon/check-circle-fill.svg" : "";
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
                      "text": article.value.hash || '無序號' ,
                      "wrap": true,
                      "color": "#666666",
                      "size": "sm",
                      "flex": 5
                    },
                    {
                      "type": "icon",
                      "size": "xl",
                      "url": "https://yilanpass.com/one_text.png",
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
  if (process.client) {
    navigator.clipboard.writeText(index_liff_url + route.path);
    window?.alert('已複製連結!')
  }
}
const shareCoupon = () => {
  if (!process.client) return;
  
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
                "type": "text",
                "text": "點我看更多",
                "color": "#Ffffff",
                "align": "center"
              }
            ],
            "paddingAll": "13px",
            "backgroundColor": "#ffffff1A",
            "cornerRadius": "30px",
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
<style scoped>
.cupon-text {
  overflow-wrap: break-word;
  margin-bottom: 5px;
  white-space: pre-line;
  line-height: 1.3;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  font-size: 15px;
}
.cupon-tags {
  margin-bottom: 5px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  font-size: 15px;
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
  bottom: -40px;
  padding: 10px;
  border-radius: 40px;
  display: flex;
  justify-content: space-around;
}
.coupon-pass {
  width: fit-content;
  padding: 10px;
  border-radius: 5px;
  background-color: #40a2ab;
  color: #fff;
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
.cupon-code {
  margin-bottom: 10px;
}
.cupon-map {
  margin-bottom: 5px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  font-weight: bold;
  font-size: 15px;
}

.cupon-map a {
  color: #0d6efd;
  text-decoration: none;
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.cupon-map a:hover {
  background-color: #e9ecef;
  color: #0a58ca;
  text-decoration: underline;
}

.cupon-map a::before {
  content: "📍";
  font-size: 1.2em;
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

.barcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  margin-top: 20px;
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.hash-number {
  font-size: 1.2em;
  font-weight: bold;
  color: #333;
  margin-top: 15px;
}

#barcode {
  max-width: 100%;
  height: auto;
}
</style>