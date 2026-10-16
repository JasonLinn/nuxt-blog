<template>
  <section class="import-panel" aria-labelledby="import-title">
    <div class="import-heading">
      <div><h2 id="import-title">官方活動自動更新</h2><p>資料完整就上架；缺少資訊或場次待確認的活動留在這裡。</p></div>
      <div class="import-actions">
        <button :disabled="busy" @click="sync(true)">預覽抓取</button>
        <button :disabled="busy" class="primary" @click="sync(false)">{{ busy ? '處理中…' : '立即更新' }}</button>
      </div>
    </div>
    <p v-if="message" role="status">{{ message }}</p>
    <p v-if="error" role="alert" class="import-error">{{ error }}</p>
    <div v-if="summary.length" class="import-results">
      <div v-for="row in summary" :key="row.source">
        <strong>{{ row.name }}</strong>：
        <template v-if="row.ok">{{ row.fetched }} 筆宜蘭資料；{{ row.published ?? row.eligible ?? 0 }} 筆{{ preview ? '符合上架條件' : '新增上架' }}，{{ row.pending || 0 }} 筆待確認<span v-if="row.updated">，{{ row.updated }} 筆更新</span><span v-if="row.duplicate">，{{ row.duplicate }} 筆重複</span></template>
        <span v-else class="import-error">{{ row.error }}</span>
      </div>
    </div>
    <p v-if="runs[0]" class="import-muted">最近執行：{{ new Date(runs[0].started_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) }} · {{ runStatus[runs[0].status] || runs[0].status }}</p>
    <button class="pending-toggle" :aria-expanded="showPending" aria-controls="import-pending-list" @click="showPending = !showPending">{{ showPending ? '收起' : '展開' }}待確認活動（{{ items.length }}）</button>
    <div v-if="showPending" id="import-pending-list">
      <p v-if="!items.length" class="import-muted">目前沒有待確認的自動匯入活動。</p>
      <article v-for="item in items" :key="item.source_id + item.external_id" class="import-item">
        <h3>{{ item.candidate.title || '未命名活動' }}</h3>
        <p>{{ item.source_name }} · {{ item.reasons.join('、') }}</p>
        <a v-if="item.candidate.source_url" :href="item.candidate.source_url" target="_blank" rel="noopener noreferrer">查看來源資料 ↗</a>
        <form @submit.prevent="review(item, 'publish')">
          <label>活動名稱<input v-model="item.candidate.title" required maxlength="250"></label>
          <div class="import-dates">
            <label>開始日期<input v-model="item.candidate.event_date" type="date" required></label>
            <label>結束日期<input v-model="item.candidate.end_date" type="date" required :min="item.candidate.event_date"></label>
          </div>
          <label>地點<input v-model="item.candidate.location" required maxlength="250"></label>
          <label>主辦單位<input v-model="item.candidate.organizer_name" required maxlength="250"></label>
          <label>活動說明<textarea v-model="item.candidate.description" required rows="4" maxlength="15000"></textarea></label>
          <p v-if="item.candidate.schedule?.length > 1" class="import-muted">請確認說明列出實際場次：{{ item.candidate.schedule.map(s => s.start).join('、') }}</p>
          <div class="import-actions">
            <button type="submit" class="primary" :disabled="busy">確認並上架</button>
            <button type="button" :disabled="busy" @click="review(item, 'dismiss')">略過此活動</button>
          </div>
        </form>
      </article>
    </div>
  </section>
</template>

<script setup>
const emit = defineEmits(['updated'])
const items = ref([]), runs = ref([]), summary = ref([])
const busy = ref(false), preview = ref(false), error = ref(''), message = ref('')
const showPending = ref(false)
const runStatus = { success: '全部來源完成', partial: '部分來源失敗', failed: '更新失敗' }
const errorText = e => e.data?.statusMessage || e.data?.message || e.message || '更新失敗，請稍後再試'
async function refresh() {
  try {
    const data = await $fetch('/api/admin/activity-imports')
    items.value = data.items; runs.value = data.runs
    if (!summary.value.length && runs.value[0]) summary.value = runs.value[0].summary
  } catch (e) { error.value = errorText(e) }
}
async function sync(dryRun) {
  busy.value = true; error.value = ''; message.value = ''; preview.value = dryRun
  try {
    const data = await $fetch('/api/admin/activity-imports/sync', { method: 'POST', body: { dryRun } })
    summary.value = data.summary
    message.value = dryRun ? '預覽完成，尚未儲存或上架；實際更新時還會檢查重複與人工修改。' : data.ok ? '更新完成。' : '部分來源未完成，成功的來源已儲存，請查看紀錄。'
    if (!dryRun) { await refresh(); emit('updated') }
  } catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}
async function review(item, action) {
  busy.value = true; error.value = ''; message.value = ''
  try {
    await $fetch('/api/admin/activity-imports/review', { method: 'POST', body: { source: item.source_id, externalId: item.external_id, action, data: item.candidate } })
    message.value = action === 'publish' ? '活動已上架，後續採人工維護。' : '已略過，之後抓取不會重新上架。'
    await refresh(); emit('updated')
  } catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}
onMounted(refresh)
</script>

<style scoped>
.import-panel { background: white; border: 1px solid #e0e7ee; border-radius: 16px; padding: 24px; margin-bottom: 28px; color: #334155; }
.import-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
h2 { font-size: 1.3rem; } h3 { font-size: 1.1rem; } p { margin: 8px 0; }
.import-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0; }
button { border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; padding: 9px 16px; }
button.primary { color: white; background: #2563eb; border-color: #2563eb; } button:disabled { opacity: .55; }
.import-results { background: #f1f5f9; padding: 16px; border-radius: 10px; margin: 16px 0; line-height: 1.9; }
.import-error { color: #b91c1c; }.import-muted { color: #64748b; font-size: .9rem; }
.pending-toggle { cursor: pointer; font-weight: 600; margin-top: 12px; }
.import-item { border-top: 1px solid #e2e8f0; padding: 20px 0; overflow-wrap: anywhere; }
label { display: block; margin: 10px 0; font-size: .9rem; } input, textarea { display: block; width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; margin-top: 4px; }
.import-dates { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 540px) { .import-panel { padding: 16px; } .import-dates { grid-template-columns: 1fr; gap: 0; } }
</style>
