<template>
  <div class="yp-page yp-page--form">
    <nav class="yp-breadcrumb" aria-label="麵包屑">
      <NuxtLink to="/">首頁</NuxtLink>
      <NuxtLink to="/homestay-list">民宿</NuxtLink>
      <span>找房需求</span>
    </nav>

    <header class="yp-page-head">
      <div>
        <span class="yp-page-head__eyebrow">住宿服務</span>
        <h1 class="yp-page-head__title">找房需求</h1>
        <p class="yp-page-head__desc">填寫入住日期、人數與設備需求，我們將協助您媒合合適的民宿。</p>
      </div>
    </header>

    <section class="yp-form-section">
      <h2 class="yp-form-section__title">需求內容</h2>
      <p class="yp-form-section__desc">請依下列格式修改範例內容，並留下可聯繫您的方式。</p>

      <div class="fr-line">
        <Icon name="ri:line-fill" class="fr-line__icon" />
        <span class="fr-line__label">LINE 識別碼</span>
        <span id="userId" class="fr-line__id">尚未取得</span>
      </div>

      <label for="findRoomText" class="form-label">需求說明</label>
      <textarea
        id="findRoomText"
        v-model="text"
        class="form-control fr-textarea"
        rows="10"
        name="findRoomText"
      ></textarea>
      <div class="form-text">
        建議包含：聯絡人、LINE 或電話、入住日期、人數、房數、設備需求與預算。
      </div>
    </section>

    <div class="yp-form-actions">
      <button type="button" class="btn btn-primary btn-icon" @click="sentNotify">
        <Icon name="ri:send-plane-line" />送出需求
      </button>
    </div>
  </div>
</template>

<script setup>
import { loadLiff } from '~/utils/liff-client'

useSeoMeta({
  title: '找房需求 - 宜蘭旅遊通',
  description: '填寫您的找房需求，我們將協助您找到合適的民宿。',
  canonical: 'https://yilanpass.com/findRoom'
})

useHead({
  link: [
    {
      rel: 'canonical',
      href: 'https://yilanpass.com/findRoom'
    }
  ]
})

let userId = ref('xxxxxx')
const text =
  '聯絡人：林小明\n' +
  'LINE:abc123\n' +
  // '電話：\n' +
  // 'ＬＩＮＥ：\n' +
  '預計入住日期：7/1\n' +
  '預計入住人數：16\n' +
  '預計需求房數：3+1\n' +
  '希望民宿設備：麻將\n' +
  '住宿預算：50000'
onMounted(async () => {
  try {
    const liff = await loadLiff()
    await liff.init({ liffId: '2005661804-pZRYaLm6' }) // Use own liffId
    await liff.getProfile().then((profile) => {
      if (!liff.isLoggedIn()) {
        return
      }
      // 拿取profile
      document.getElementById('userId').innerHTML = profile.userId
      userId = profile.userId
      // displayName.value = profile.displayName
      imgUrl = profile.pictureUrl
      // document.getElementById('statusMessage').innerHTML = profile.statusMessage
    })
  } catch (err) {
    console.log(`liff.state init error ${err}`)
  }
})

const sentNotify = () => {
  // 群組權杖

  useFetch('/api/notify', {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/x-www-form-urlencoded',
      // 'Sec-Fetch-Mode:': 'cors',

      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*'
      // 'Accept': '*/*',
      // 'Sec-Fetch-Site': 'same-origin',
    },
    method: 'POST',
    message: '你好阿',
    body: {
      message: '你好阿22212313' + 'U6a5aaa9d07c1d3742e19ccbdbe3b9e4a',
      imageThumbnail: 'https//' + 'U6a5aaa9d07c1d3742e19ccbdbe3b9e4a'
    },
    query: {
      message:
        '\n【~~訂單來囉~~】\n' +
        text +
        '\n\n點連結以回覆訂單: ' +
        JSON.stringify('https://yilanpass.com/reply?id=' + userId),
      // "imageThumbnail": "https//" + id,
      stickerId: '52002736',
      stickerPackageId: '11537'
    }
  })
    .then((res) => {
      alert('發送成功!')
    })
    .catch((error) => alert('發送失敗!請洽工程人員，錯誤代碼:' + error))
}
</script>

<style lang="scss" scoped>
.fr-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 10px 14px;
  border-radius: $yp-radius;
  background: $yp-surface-2;
  font-size: 0.875rem;

  &__icon {
    flex: none;
    font-size: 1.25rem;
    color: $yp-line-green;
  }

  &__label {
    flex: none;
    color: $yp-muted;
  }

  &__id {
    min-width: 0;
    color: $yp-ink;
    word-break: break-all;
  }
}

.fr-textarea {
  min-height: 220px;
  line-height: 1.7;
  resize: vertical;
}
</style>
