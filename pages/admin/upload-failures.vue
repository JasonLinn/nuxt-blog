<template>
  <div class="container-fluid py-4">
    <h1 class="h3">上傳與送審失敗紀錄</h1>
    <form class="row g-2 align-items-end my-3" @submit.prevent="search">
      <div class="col-sm-auto">
        <label class="form-label" for="failure-day">發生日期（台灣時間）</label>
        <input id="failure-day" v-model="day" type="date" class="form-control" :disabled="!!id.trim()" required />
      </div>
      <div class="col-sm-6">
        <label class="form-label" for="failure-id">查詢碼（可跨日期查詢）</label>
        <input id="failure-id" v-model="id" class="form-control" autocomplete="off" />
      </div>
      <div class="col-auto"><button class="btn btn-primary" :disabled="loading">查詢</button></div>
    </form>
    <p v-if="loading" role="status">查詢中…</p>
    <p v-else-if="error" role="alert" class="alert alert-danger">{{ error }}</p>
    <p v-else-if="!rows.length" class="yp-empty">沒有符合條件的紀錄。</p>
    <div v-else class="table-responsive">
      <p v-if="truncated">顯示當日最近 200 筆，可輸入查詢碼查找其他紀錄。</p>
      <table class="table align-middle">
        <thead><tr><th>台灣時間</th><th>功能／步驟</th><th>原因</th><th>圖片</th><th>查詢碼</th></tr></thead>
        <tbody><tr v-for="row in rows" :key="row.id">
          <td>{{ time.format(new Date(row.occurred_at)) }}</td>
          <td>{{ failureSources[row.source] }}／{{ failureStages[row.stage] }}</td>
          <td>{{ failureReasons[row.reason] }} <small v-if="row.detail">{{ couponFields[row.detail] || row.detail }}</small> <small v-if="row.http_status">HTTP {{ row.http_status }}</small></td>
          <td>{{ row.file_type || '—' }} <small v-if="row.file_bytes != null">{{ (row.file_bytes / 1048576).toFixed(2) }} MB</small></td>
          <td><code>{{ row.id }}</code></td>
        </tr></tbody>
      </table>
    </div>
  </div>
</template>
<script setup>
import { couponFields, failureSources, failureStages, failureReasons } from '~/utils/upload-failures'
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
const day = ref(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei' }).format(new Date()))
const time = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', dateStyle: 'short', timeStyle: 'medium', hour12: false })
const id = ref('')
const rows = ref([])
const loading = ref(true)
const error = ref('')
const truncated = ref(false)
async function search() {
  loading.value = true
  error.value = ''
  try {
    const result = await $fetch('/api/admin/upload-failures', { query: id.value.trim() ? { id: id.value.trim() } : { day: day.value } })
    rows.value = result.rows
    truncated.value = result.truncated
  } catch (e) { error.value = e.data?.message || '無法查詢，請重新登入或稍後再試。' }
  finally { loading.value = false }
}
onMounted(search)
</script>
