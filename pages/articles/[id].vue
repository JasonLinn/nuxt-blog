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
        <div class="mt-4 flex justify-center">
          <img :src="article.cover" class="cupon-img" />
        </div>
        <div class="cupon-time my-2 flex flex-col justify-between sm:my-0 sm:flex-row sm:items-center">
          <time class="my-2 text-sm text-gray-400">
            {{ new Date(article.updated_at).toLocaleString('zh-TW') }}
          </time>
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
              <button type="button" @click="handleRecive">確定</button>
            </div>
          </div>
        </div>
      </div>
      <button v-show="article.amount && article.hash[0]" type="button" class="btn btn-success" @click="showModal">
        領取限量優惠券
      </button>
      <button v-show="article.amount && !article.hash[0]" type="button" class="btn btn-success" @click="sendCupon">
        領取優惠券
      </button>
    </div>
    </template>
  </div>
</template>
<style>
.cupon-text {
  overflow-wrap: break-word;
  margin-bottom: 30px;
}
.cupon-img {
  max-width: 100%;
}
.cupon-time {
  display: flex;
  justify-content: space-between;
}
.cupon-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
}
.cupon-amount {
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}
</style>

<script setup>
import liff from "@line/liff";
const { $bootstrap } = useNuxtApp();
const modalRef = ref(null);
let modal;
let hash = []
const showModal = () => {
  modal.show();
};

onMounted(() => {
  modal = $bootstrap.modal(modalRef.value);
});

onBeforeUnmount(() => {
  // 加上 dispose，避免切換頁面時或是 HMR 看到殘留畫面
  modal.dispose();
});

const route = useRoute()

const { pending, data: article, error } = await useFetch(`/api/articles/${route.params.id}`)

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

const handleRecive = () => {
  let articleHash = article.value.hash
  let index = articleHash.findIndex((i) =>hash == i)

  console.log(article,'cccc', articleHash, index)
  if (index >= 0) {
    sendCupon()
    alert('序號正確')
    modal.hide()
    } else {
      alert('序號錯誤')
    }
}

const sendCupon = () => {
  // if (!liff.isLoggedIn()) {
  //   return;
  // }
  console.log(article, 'aaaa')
  let cupon = {
        "type": "bubble",
        "hero": {
          "type": "image",
          "url": article.value.cover,
          "size": "full",
          "aspectRatio": "20:13",
          "aspectMode": "cover",
          "action": {
            "type": "uri",
            "uri": "https://line.me/"
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
              "size": "xl"
            },
            {
              "type": "box",
              "layout": "baseline",
              "margin": "md",
              "contents": [
                {
                  "type": "icon",
                  "size": "sm",
                  "url": "https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png"
                },
                {
                  "type": "icon",
                  "size": "sm",
                  "url": "https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png"
                },
                {
                  "type": "icon",
                  "size": "sm",
                  "url": "https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png"
                },
                {
                  "type": "icon",
                  "size": "sm",
                  "url": "https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png"
                },
                {
                  "type": "icon",
                  "size": "sm",
                  "url": "https://developers-resource.landpress.line.me/fx/img/review_gray_star_28.png"
                }
              ]
            },
            {
              "type": "box",
              "layout": "vertical",
              "margin": "lg",
              "spacing": "sm",
              "contents": [{
                  "type": "box",
                  "layout": "baseline",
                  "spacing": "sm",
                  "contents": [
                    {
                      "type": "text",
                      "text": "序號",
                      "color": "#aaaaaa",
                      "size": "sm",
                      "flex": 1
                    },
                    {
                      "type": "text",
                      "text": article.value.hash[0] || '無序號' ,
                      "wrap": true,
                      "color": "#666666",
                      "size": "sm",
                      "flex": 5
                    }
                  ]
                },
                {
                  "type": "box",
                  "layout": "baseline",
                  "spacing": "sm",
                  "contents": [
                    {
                      "type": "text",
                      "text": "說明",
                      "color": "#aaaaaa",
                      "size": "sm",
                      "flex": 1
                    },
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
        "footer": {
          "type": "box",
          "layout": "vertical",
          "spacing": "sm",
          "contents": [
            {
              "type": "button",
              "style": "link",
              "height": "sm",
              "action": {
                "type": "uri",
                "label": "優惠券說明頁",
                "uri": window.location.href
              }
            },
            {
              "type": "box",
              "layout": "vertical",
              "contents": [],
              "margin": "sm"
            }
          ],
          "flex": 0
        }
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
        sendPatch()
      })
      .catch(error => window.alert('未登入LINE帳號'+ error));
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
  ogImage: article.value.cover,
  ogUrl: () => `${origin}${baseURL}/articles/${article.value.id}`,
  twitterTitle: article.value.title,
  twitterDescription: description,
  twitterImage: article.value.cover,
  twitterUrl: () => `${origin}${baseURL}/articles/${article.value.id}`,
  twitterCard: 'summary_large_image'
})
</script>
