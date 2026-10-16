<template>
  <section class="yp-card import-panel" aria-labelledby="import-title">
    <div class="yp-card__head import-panel__head">
      <div>
        <h2 id="import-title" class="yp-card__head-title">
          <Icon name="ri:refresh-line" class="me-1" /> 官方活動自動更新
        </h2>
        <p class="import-muted mb-0">
          官方活動確認名稱、日期、地點與來源後即可上架，優先補上照片；主辦與簡介可留空。
        </p>
      </div>
      <div class="import-actions">
        <button type="button" class="btn btn-soft" :disabled="busy" @click="sync(true)">
          <Icon name="ri:eye-line" /> 預覽抓取
        </button>
        <button type="button" class="btn btn-primary" :disabled="busy" @click="sync(false)">
          <span v-if="busy" class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          <Icon v-else name="ri:download-cloud-2-line" />
          {{ busy ? '處理中…' : '立即更新' }}
        </button>
      </div>
    </div>

    <div class="yp-card__section">
      <p v-if="message" role="status" class="import-notice import-notice--ok">
        <Icon name="ri:checkbox-circle-line" /> {{ message }}
      </p>
      <p v-if="error" role="alert" class="import-notice import-notice--error">
        <Icon name="ri:error-warning-line" /> {{ error }}
      </p>

      <ul v-if="summary.length" class="import-results">
        <li v-for="row in summary" :key="row.source">
          <span class="yp-status" :class="row.ok ? 'yp-status--approved' : 'yp-status--rejected'">{{
            row.ok ? '成功' : '失敗'
          }}</span>
          <div class="import-results__text">
            <strong>{{ row.name }}</strong
            >：
            <template v-if="row.ok"
              >{{ row.fetched }} 筆宜蘭資料；{{ row.published ?? row.eligible ?? 0 }} 筆{{
                preview ? '符合上架條件' : '新增上架'
              }}，{{ row.pending || 0 }} 筆待確認<span v-if="row.updated"
                >，{{ row.updated }} 筆更新</span
              ><span v-if="row.duplicate">，{{ row.duplicate }} 筆重複</span></template
            >
            <span v-else class="import-error">{{ row.error }}</span>
            <small v-if="row.warnings?.length" class="d-block import-muted">{{
              row.warnings.join('；')
            }}</small>
          </div>
        </li>
      </ul>

      <p v-if="runs[0]" class="import-muted mb-0">
        最近執行：{{
          new Date(runs[0].started_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
        }}
        · {{ runStatus[runs[0].status] || runs[0].status }}
      </p>

      <button
        type="button"
        class="btn btn-soft btn-sm pending-toggle"
        :aria-expanded="showPending"
        aria-controls="import-pending-list"
        @click="showPending = !showPending"
      >
        <Icon :name="showPending ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" />
        {{ showPending ? '收起' : '展開' }}待確認活動（{{ items.length }}）
      </button>

      <div v-if="showPending" id="import-pending-list">
        <p v-if="!items.length" class="import-muted">目前沒有待確認的自動匯入活動。</p>
        <article v-for="item in items" :key="item.source_id + item.external_id" class="import-item">
          <div class="d-flex align-items-center mb-1 flex-wrap gap-2">
            <h3 class="import-item__title">{{ item.candidate.title || '未命名活動' }}</h3>
            <span class="yp-status yp-status--pending">待確認</span>
          </div>
          <p class="import-muted mb-1">{{ item.source_name }} · {{ item.reasons.join('、') }}</p>
          <a
            v-if="item.candidate.source_url"
            :href="item.candidate.source_url"
            target="_blank"
            rel="noopener noreferrer"
            class="import-link"
          >
            查看來源資料 <Icon name="ri:external-link-line" />
          </a>
          <form class="mt-3" @submit.prevent="review(item, 'publish')">
            <div class="mb-3">
              <label class="form-label required">活動名稱</label>
              <input v-model="item.candidate.title" class="form-control" required maxlength="250" />
            </div>
            <div class="row g-3 mb-3">
              <div class="col-sm-6">
                <label class="form-label required">開始日期</label>
                <input
                  v-model="item.candidate.event_date"
                  class="form-control"
                  type="date"
                  required
                />
              </div>
              <div class="col-sm-6">
                <label class="form-label required">結束日期</label>
                <input
                  v-model="item.candidate.end_date"
                  class="form-control"
                  type="date"
                  required
                  :min="item.candidate.event_date"
                />
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label required">地點</label>
              <input
                v-model="item.candidate.location"
                class="form-control"
                required
                maxlength="250"
              />
            </div>
            <div class="mb-3">
              <label
                class="form-label"
                :class="{ required: !optionalField(item, 'organizerOptional') }"
                >主辦單位{{ optionalField(item, 'organizerOptional') ? '（可留空）' : '' }}</label
              >
              <input
                v-model="item.candidate.organizer_name"
                class="form-control"
                :required="!optionalField(item, 'organizerOptional')"
                maxlength="250"
              />
            </div>
            <div class="mb-3">
              <label
                class="form-label"
                :class="{ required: !optionalField(item, 'descriptionOptional') }"
                >活動說明{{ optionalField(item, 'descriptionOptional') ? '（可留空）' : '' }}</label
              >
              <textarea
                v-model="item.candidate.description"
                class="form-control"
                :required="!optionalField(item, 'descriptionOptional')"
                rows="4"
                maxlength="15000"
              ></textarea>
            </div>
            <p v-if="item.candidate.schedule?.length > 1" class="import-muted">
              請確認說明列出實際場次：{{ item.candidate.schedule.map((s) => s.start).join('、') }}
            </p>
            <div class="import-actions">
              <button type="submit" class="btn btn-primary" :disabled="busy">
                <Icon name="ri:checkbox-circle-line" /> 確認並上架
              </button>
              <button
                type="button"
                class="btn btn-soft"
                :disabled="busy"
                @click="review(item, 'dismiss')"
              >
                略過此活動
              </button>
            </div>
          </form>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
const emit = defineEmits(['updated'])
const items = ref([])
const runs = ref([])
const summary = ref([])
const sources = ref([])
const optionalField = (item, key) =>
  sources.value.some((source) => source.id === item.source_id && source.official && source[key])
const busy = ref(false)
const preview = ref(false)
const error = ref('')
const message = ref('')
const showPending = ref(false)
const runStatus = { success: '全部來源完成', partial: '部分來源失敗', failed: '更新失敗' }
const errorText = (e) =>
  e.data?.statusMessage || e.data?.message || e.message || '更新失敗，請稍後再試'
async function refresh() {
  try {
    const data = await $fetch('/api/admin/activity-imports')
    items.value = data.items
    runs.value = data.runs
    sources.value = data.sources || []
    if (!summary.value.length && runs.value[0]) summary.value = runs.value[0].summary
  } catch (e) {
    error.value = errorText(e)
  }
}
async function sync(dryRun) {
  busy.value = true
  error.value = ''
  message.value = ''
  preview.value = dryRun
  try {
    const data = await $fetch('/api/admin/activity-imports/sync', {
      method: 'POST',
      body: { dryRun }
    })
    summary.value = data.summary
    message.value = dryRun
      ? '預覽完成，尚未儲存或上架；實際更新時還會檢查重複與人工修改。'
      : data.ok
      ? '更新完成。'
      : '部分來源未完成，成功的來源已儲存，請查看紀錄。'
    if (!dryRun) {
      await refresh()
      emit('updated')
    }
  } catch (e) {
    error.value = errorText(e)
  } finally {
    busy.value = false
  }
}
async function review(item, action) {
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    await $fetch('/api/admin/activity-imports/review', {
      method: 'POST',
      body: { source: item.source_id, externalId: item.external_id, action, data: item.candidate }
    })
    message.value =
      action === 'publish' ? '活動已上架，後續採人工維護。' : '已略過，之後抓取不會重新上架。'
    await refresh()
    emit('updated')
  } catch (e) {
    error.value = errorText(e)
  } finally {
    busy.value = false
  }
}
onMounted(refresh)
</script>

<style scoped lang="scss">
.import-panel {
  margin-bottom: 20px;

  &__head {
    flex-wrap: wrap;
    align-items: flex-start;
  }
}

.import-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
}

.import-muted {
  color: $yp-muted;
  font-size: 0.875rem;
}

.import-error {
  color: $yp-danger;
}

.import-notice {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0 0 12px;
  padding: 10px 14px;
  border-radius: $yp-radius-sm;
  font-size: 0.9375rem;

  &--ok {
    background: $yp-success-soft;
    color: #15803d;
  }

  &--error {
    background: $yp-danger-soft;
    color: #b91c1c;
  }
}

.import-results {
  list-style: none;
  margin: 0 0 12px;
  padding: 4px 14px;
  background: $yp-surface-2;
  border-radius: $yp-radius;

  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid $yp-line;

    &:last-child {
      border-bottom: 0;
    }
  }

  &__text {
    min-width: 0;
    line-height: 1.7;
    overflow-wrap: anywhere;
  }
}

.pending-toggle {
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.import-item {
  border-top: 1px solid $yp-line;
  margin-top: 16px;
  padding-top: 16px;
  overflow-wrap: anywhere;

  &__title {
    font-size: 1.0625rem;
    font-weight: 700;
    margin: 0;
  }
}

.import-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.875rem;
  color: $yp-primary-ink;
}
</style>
