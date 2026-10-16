<template>
  <div class="yp-page yp-page--form">
    <header class="yp-page-head">
      <div>
        <span class="yp-page-head__eyebrow">代訂服務</span>
        <h1 class="yp-page-head__title">回覆資訊</h1>
        <p class="yp-page-head__desc">編輯要回覆給客人的訊息內容後送出。</p>
      </div>
    </header>

    <div class="yp-form-section">
      <label for="reply-text" class="form-label">回覆資訊</label>
      <textarea
        id="reply-text"
        v-model="text"
        name="reply"
        class="form-control reply-text"
        rows="10"
      ></textarea>
      <div class="yp-form-actions mt-3">
        <button type="button" class="btn btn-primary btn-icon" @click.once="sendMSG">
          <Icon name="ri:send-plane-fill" />送出
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const text = ref('推薦您好客民宿\n' + '編號: 001')
const route = useRoute()
const id = route?.query?.id
const token = route?.query?.token
const sendMSG = async () => {
  console.log(id, 'iiiii')

  // 由Notify發送訊息
  if (token) {
    await useFetch('/api/notify', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/x-www-form-urlencoded',
        // 'Sec-Fetch-Mode:': 'cors',
        Authorization: 'Bearer ' + token,
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*'
        // 'Accept': '*/*',
        // 'Sec-Fetch-Site': 'same-origin',
      },
      method: 'POST',
      body: {
        token,
        text: text.value
      }
    }).then((res) => {
      alert('發送成功!')
    })
  }

  // 由官方LINE push message
  if (id) {
    await useFetch('/api/sendMsg', {
      method: 'POST',
      body: {
        id,
        text: text.value
      }
    }).then((res) => {
      alert('發送成功!')
    })
  }
}
</script>

<style scoped lang="scss">
.reply-text {
  min-height: 220px;
  line-height: 1.7;
}
</style>
