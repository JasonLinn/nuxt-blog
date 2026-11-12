<template>
  <section class="yp-card mb-3 p-3" aria-label="會員 ID 對照">
    <div class="d-flex align-items-start justify-content-between flex-wrap gap-2">
      <div>
        <h2 class="yp-section-head__title">已保存的會員對照與待確認清單</h2>
        <p class="text-muted mb-2">只保存候選和 ID 對照，不建立新民宿，也不變更公開資料。</p>
      </div>
      <button class="btn btn-outline-primary" :disabled="busy || !!saving" @click="stage">
        {{ busy ? '處理中…' : '更新待確認清單' }}
      </button>
    </div>
    <p v-if="message" class="alert alert-success" role="status">{{ message }}</p>
    <p v-if="error" class="alert alert-warning" role="alert">{{ error }}</p>
    <p v-if="busy" aria-live="polite">正在讀取會員對照…</p>
    <template v-if="reviews">
      <p class="small text-muted">
        已保存 {{ reviews.summary.total }} 筆 · 已確認對照 {{ reviews.summary.linked }} 筆 · 待確認
        {{ reviews.summary.pending }} 筆 · 已匯入 {{ reviews.summary.imported || 0 }} 筆 ·
        本次名單未出現 {{ reviews.summary.absent }} 筆
      </p>
      <div class="yp-filter-bar">
        <label for="member-review-search" class="visually-hidden">搜尋已保存會員</label>
        <input
          id="member-review-search"
          v-model="search"
          class="form-control"
          type="search"
          placeholder="搜尋已保存會員名稱或 ID"
        />
        <label for="member-review-filter" class="visually-hidden">保存狀態</label>
        <select id="member-review-filter" v-model="filter" class="form-select">
          <option value="pending">待確認</option>
          <option value="linked">已確認對照</option>
          <option value="absent">本次名單未出現</option>
          <option value="all">全部</option>
        </select>
      </div>
      <div v-if="!filtered.length" class="yp-empty">
        <h3 class="yp-empty__title">沒有符合條件的保存資料</h3>
        <p class="yp-empty__text">可按「更新待確認清單」保存最新候選，或切換篩選條件。</p>
      </div>
      <div v-else class="yp-table-wrap">
        <div class="table-responsive">
          <table class="yp-table-stack table align-middle">
            <thead>
              <tr>
                <th>協會會員</th>
                <th>狀態與配對依據</th>
                <th>確認既有民宿對照</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in visible" :key="item.external_id">
                <td data-label="協會會員">
                  <strong>{{ item.name }}</strong>
                  <div>{{ item.area }}</div>
                  <small class="review-id">{{ item.external_id }}</small>
                  <div class="small mt-2">電話：{{ item.phone || '未提供' }}</div>
                  <a
                    v-if="item.website"
                    :href="item.website"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="small review-id"
                    >{{ item.website }}</a
                  >
                </td>
                <td data-label="狀態與配對依據">
                  <span
                    class="yp-tag"
                    :class="item.confirmed_homestay_id ? 'yp-tag--success' : 'yp-tag--warning'"
                    >{{
                      item.imported
                        ? item.publication_state === 'active'
                          ? '已匯入'
                          : '匯入後待確認'
                        : item.confirmed_homestay_id
                        ? '已確認對照'
                        : labels[item.category]
                    }}</span
                  >
                  <p v-if="!item.present_in_source" class="small text-warning mt-2">
                    本次名單未出現，保留對照與待確認記錄。
                  </p>
                  <p v-if="item.needs_refresh" class="small text-warning mt-2">
                    資料已變動，請先更新待確認清單。
                  </p>
                  <ul class="small mt-2 ps-3">
                    <li v-for="reason in item.reasons" :key="reason">{{ reason }}</li>
                  </ul>
                  <details v-if="item.candidates.length">
                    <summary>檢視候選依據</summary>
                    <ul class="small ps-3">
                      <li v-for="candidate in item.candidates" :key="candidate.id">
                        {{ candidate.name }}（#{{ candidate.id }}）：{{
                          candidate.signals.map((signal) => signalLabels[signal]).join('、') ||
                          '固定 ID'
                        }}；區域{{ candidate.area_matches ? '一致' : '不同' }}
                        <span v-if="candidate.protected">／審核限制</span
                        ><span
                          v-if="candidate.claimed_by && candidate.claimed_by !== item.external_id"
                          >／已被其他會員對應</span
                        >
                        <div>
                          區域：{{ candidate.area }} · 電話：{{ candidate.phone || '未提供' }}
                        </div>
                        <a
                          v-if="candidate.website"
                          :href="candidate.website"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="review-id"
                          >{{ candidate.website }}</a
                        >
                      </li>
                    </ul>
                  </details>
                </td>
                <td data-label="確認既有民宿對照">
                  <p v-if="item.confirmed_homestay_id" class="mb-0">
                    固定對照：#{{ item.confirmed_homestay_id }}<br /><small
                      >改名、關閉後重開仍保留此 ID。</small
                    >
                  </p>
                  <form
                    v-else-if="canReview(item)"
                    class="review-form"
                    @submit.prevent="confirmLink(item)"
                  >
                    <label :for="`target-${item.external_id}`" class="form-label"
                      >選擇既有民宿</label
                    >
                    <select
                      :id="`target-${item.external_id}`"
                      v-model="selected[item.external_id]"
                      :aria-label="`${item.name}對照民宿`"
                      class="form-select"
                      required
                      :disabled="!!saving"
                    >
                      <option value="">請逐筆確認後選擇</option>
                      <option
                        v-for="candidate in availableCandidates(item)"
                        :key="candidate.id"
                        :value="candidate.id"
                      >
                        {{ candidate.name }}（#{{ candidate.id }}）
                      </option>
                    </select>
                    <label :for="`note-${item.external_id}`" class="form-label mt-2"
                      >確認依據{{
                        item.category === 'review' ? '（至少 4 字）' : '（選填）'
                      }}</label
                    >
                    <textarea
                      :id="`note-${item.external_id}`"
                      v-model="notes[item.external_id]"
                      :aria-label="`${item.name}確認依據`"
                      class="form-control"
                      rows="2"
                      maxlength="500"
                      :required="item.category === 'review'"
                      :minlength="item.category === 'review' ? 4 : undefined"
                      :disabled="!!saving"
                    ></textarea>
                    <div class="form-check mt-2">
                      <input
                        :id="`ack-${item.external_id}`"
                        v-model="acknowledged[item.external_id]"
                        class="form-check-input"
                        type="checkbox"
                        required
                        :disabled="!!saving"
                      />
                      <label :for="`ack-${item.external_id}`" class="form-check-label"
                        >已確認這兩個 ID 是同一家民宿</label
                      >
                    </div>
                    <button
                      class="btn btn-primary mt-2"
                      :aria-label="`${item.name}：確認此對照`"
                      :disabled="
                        !!saving || !selected[item.external_id] || !acknowledged[item.external_id]
                      "
                    >
                      {{ saving === item.external_id ? '保存中…' : '確認此對照' }}
                    </button>
                  </form>
                  <p v-else-if="item.imported" class="small text-muted mb-0">
                    已保存公開介紹；無登入帳號或房況資料。
                  </p>
                  <p v-else class="small text-muted mb-0">保留待確認，這裡不會直接新增或匯入。</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="yp-table-wrap__footer d-flex justify-content-between flex-wrap gap-2">
          <span>{{ filtered.length }} 筆 · 第 {{ page }} / {{ pages }} 頁</span>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary" :disabled="page <= 1" @click="page--">
              前一頁待確認</button
            ><button class="btn btn-outline-primary" :disabled="page >= pages" @click="page++">
              後一頁待確認
            </button>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup>
const reviews = ref(null)
const busy = ref(false)
const saving = ref('')
const error = ref('')
const message = ref('')
const search = ref('')
const filter = ref('pending')
const page = ref(1)
const selected = ref({})
const notes = ref({})
const acknowledged = ref({})
const labels = {
  new: '待新增確認',
  match: '高可信配對候選',
  review: '疑似重複待確認',
  blocked: '既有審核限制',
  invalid: '資料異常',
  linked: '已確認對照'
}
const signalLabels = { name: '名稱', website: '官網', phone: '電話' }
const filtered = computed(() =>
  (reviews.value?.items || []).filter(
    (item) =>
      (filter.value === 'all' ||
        (filter.value === 'pending' &&
          !item.confirmed_homestay_id &&
          (!item.imported || item.publication_state !== 'active')) ||
        (filter.value === 'linked' && item.confirmed_homestay_id) ||
        (filter.value === 'absent' && !item.present_in_source)) &&
      `${item.name} ${item.external_id} ${item.confirmed_homestay_id || ''}`
        .toLowerCase()
        .includes(search.value.trim().toLowerCase())
  )
)
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 5)))
const visible = computed(() => filtered.value.slice((page.value - 1) * 5, page.value * 5))
watch([filter, search], () => {
  page.value = 1
})
const availableCandidates = (item) =>
  item.candidates.filter((candidate) => !candidate.protected && !candidate.claimed_by)
const canReview = (item) =>
  !busy.value &&
  item.present_in_source &&
  !item.needs_refresh &&
  ['match', 'review'].includes(item.category) &&
  availableCandidates(item).length
const errorText = (err) => err.data?.data?.message || '對照操作暫時無法完成，請稍後重試。'
async function load() {
  const result = await $fetch('/api/admin/association-sync/reviews')
  reviews.value = result
  page.value = Math.min(page.value, pages.value)
  selected.value = Object.fromEntries(result.items.map((item) => [item.external_id, '']))
  notes.value = {}
  acknowledged.value = {}
}
async function stage() {
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    const result = await $fetch('/api/admin/association-sync/stage', { method: 'POST', retry: 0 })
    await load()
    message.value = `已保存 ${result.staged} 筆候選；沒有自動確認配對或匯入會員。`
  } catch (err) {
    error.value = errorText(err)
  } finally {
    busy.value = false
  }
}
async function confirmLink(item) {
  if (!canReview(item) || !acknowledged.value[item.external_id]) return
  saving.value = item.external_id
  error.value = ''
  message.value = ''
  try {
    const result = await $fetch('/api/admin/association-sync/link', {
      method: 'POST',
      retry: 0,
      body: {
        external_id: item.external_id,
        homestay_id: selected.value[item.external_id],
        revision: item.revision,
        note: notes.value[item.external_id] || ''
      }
    })
    await load()
    message.value = `已保存固定對照 #${result.homestay_id}；會員公開資料未變更。`
  } catch (err) {
    error.value = errorText(err)
  } finally {
    saving.value = ''
  }
}
onMounted(async () => {
  busy.value = true
  try {
    await load()
  } catch (err) {
    error.value = errorText(err)
  } finally {
    busy.value = false
  }
})
</script>

<style scoped lang="scss">
.review-id {
  overflow-wrap: anywhere;
}
.review-form {
  min-width: 210px;
}
td {
  vertical-align: top;
}
summary {
  cursor: pointer;
  min-height: 40px;
}
@media (max-width: 767px) {
  .yp-table-stack td {
    display: block;
    text-align: left;
    &[data-label]::before {
      display: block;
      margin: 8px 0;
    }
  }
}
@media (min-width: 768px) {
  th:first-child {
    width: 20%;
  }
  th:nth-child(2) {
    width: 40%;
  }
}
</style>
