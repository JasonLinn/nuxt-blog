<template>
  <div class="admin-availability-calendar">
    <!-- 日曆標題和控制 -->
    <div class="yp-card__head cal-head">
      <div>
        <h3 class="yp-card__head-title d-flex align-items-center gap-2">
          <Icon name="ri:calendar-check-line" class="cal-head__icon" />
          空房狀態管理
        </h3>
        <p class="cal-head__desc">點擊日期切換可用/不可用狀態</p>
      </div>

      <button
        v-if="hasChanges"
        type="button"
        class="btn btn-primary btn-icon"
        :disabled="saving"
        @click="saveChanges"
      >
        <span v-if="saving" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        <Icon v-else name="ri:save-line" />
        {{ saving ? '儲存中...' : '儲存變更' }}
      </button>
    </div>

    <div class="cal-body">
      <!-- 批量操作工具 -->
      <div class="cal-batch">
        <div class="cal-batch__actions">
          <button
            type="button"
            class="btn btn-sm btn-icon"
            :class="rangeSelectionMode ? 'btn-primary' : 'btn-soft'"
            @click="selectDateRange"
          >
            <Icon name="ri:drag-move-2-line" />
            {{ rangeSelectionMode ? '取消選擇' : '範圍選擇' }}
          </button>

          <template v-if="rangeSelectionMode">
            <button
              type="button"
              class="btn btn-sm btn-outline-primary"
              @click="setRangeAvailable(true)"
            >
              設為可用
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-danger"
              @click="setRangeAvailable(false)"
            >
              設為不可用
            </button>
          </template>
        </div>

        <div v-if="rangeSelectionMode && selectedRange.start" class="cal-batch__info">
          已選擇: {{ formatDisplayDate(selectedRange.start) }}
          <span v-if="selectedRange.end">~ {{ formatDisplayDate(selectedRange.end) }}</span>
        </div>
      </div>

      <!-- 載入狀態 -->
      <div v-if="loading" class="cal-loading" aria-busy="true">
        <span class="yp-skeleton" style="width: 50%; height: 28px; margin: 0 auto 16px"></span>
        <span class="yp-skeleton" style="height: 280px; border-radius: 12px"></span>
      </div>

      <!-- 錯誤狀態 -->
      <div v-else-if="error" class="yp-empty yp-empty--error">
        <div class="yp-empty__icon"><Icon name="ri:error-warning-line" /></div>
        <h4 class="yp-empty__title">日曆載入失敗</h4>
        <p class="yp-empty__text">{{ error }}</p>
        <button type="button" class="btn btn-outline-primary" @click="fetchAvailability">
          重新載入
        </button>
      </div>

      <!-- 月份導航 -->
      <div v-else class="month-nav-container">
        <div class="month-navigation">
          <button
            type="button"
            class="btn btn-ghost btn-icon nav-button"
            :disabled="!canGoToPreviousMonth"
            aria-label="上個月"
            @click="previousMonth"
          >
            <Icon name="ri:arrow-left-s-line" />
          </button>

          <span class="current-month yp-num">
            {{ currentMonth.getFullYear() }}年 {{ currentMonth.getMonth() + 1 }}月
          </span>

          <button
            type="button"
            class="btn btn-ghost btn-icon nav-button"
            :disabled="!canGoToNextMonth"
            aria-label="下個月"
            @click="nextMonth"
          >
            <Icon name="ri:arrow-right-s-line" />
          </button>
        </div>

        <!-- 日曆主體 -->
        <div class="calendar-body">
          <!-- 週標題 -->
          <div class="weekdays-header">
            <div v-for="day in weekdays" :key="day" class="weekday">
              {{ day }}
            </div>
          </div>

          <!-- 日期網格 -->
          <div class="dates-grid">
            <div
              v-for="date in calendarDates"
              :key="`${date.year}-${date.month}-${date.day}`"
              class="date-cell"
              :class="{
                'other-month': !date.isCurrentMonth,
                'past-date': date.isPast,
                available: date.isAvailable && !date.isPast,
                unavailable: !date.isAvailable && !date.isPast,
                booked: date.isBooked,
                weekend: date.isWeekend,
                today: date.isToday,
                selected: date.isSelected,
                'in-range': date.isInRange,
                'range-start': date.isRangeStart,
                'range-end': date.isRangeEnd,
                changed: date.hasChanged
              }"
              @click="handleDateClick(date)"
            >
              <div class="date-number">{{ date.day }}</div>

              <!-- 狀態指示器 -->
              <div v-if="date.isCurrentMonth && !date.isPast" class="date-indicator">
                <div v-if="date.isBooked" class="indicator-dot booked-dot"></div>
                <div v-else-if="!date.isAvailable" class="indicator-dot unavailable-dot"></div>
                <div v-else class="indicator-dot available-dot"></div>
              </div>

              <!-- 變更指示器 -->
              <div v-if="date.hasChanged" class="change-indicator">
                <Icon name="ri:edit-circle-fill" />
              </div>
            </div>
          </div>

          <!-- 圖例 -->
          <div class="calendar-legend">
            <div class="legend-item">
              <div class="legend-indicator available-dot"></div>
              <span>空房 (可預訂)</span>
            </div>
            <div class="legend-item">
              <div class="legend-indicator unavailable-dot"></div>
              <span>不開放</span>
            </div>
            <div class="legend-item">
              <div class="legend-indicator booked-dot"></div>
              <span>已預訂</span>
            </div>
            <div class="legend-item">
              <div class="legend-indicator changed-dot"></div>
              <span>已修改 (未儲存)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 變更摘要 -->
      <div v-if="hasChanges" class="changes-summary">
        <h4 class="changes-summary__title">待儲存變更</h4>
        <div class="changes-list">
          <div v-for="change in pendingChanges" :key="change.date" class="change-item">
            <span class="change-date yp-num">{{ formatDisplayDate(new Date(change.date)) }}</span>
            <Icon name="ri:arrow-right-line" class="change-arrow" />
            <span class="yp-tag" :class="change.newStatus ? 'yp-tag--success' : 'yp-tag--warning'">
              {{ change.newStatus ? '空房' : '不開放' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

// Props
const props = defineProps({
  homestayId: {
    type: String,
    required: true
  }
})

// Emits
const emit = defineEmits(['statusChanged'])

// 響應式資料
const currentMonth = ref(new Date())
const availability = ref([])
const originalAvailability = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref(null)

// 範圍選擇模式
const rangeSelectionMode = ref(false)
const selectedRange = ref({ start: null, end: null })

// 週標題
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 當前月份的邊界檢查
const today = new Date()
const maxDate = new Date()
maxDate.setMonth(maxDate.getMonth() + 6) // 半年內

const canGoToPreviousMonth = computed(() => {
  const prevMonth = new Date(currentMonth.value)
  prevMonth.setMonth(prevMonth.getMonth() - 1)
  return prevMonth >= new Date(today.getFullYear(), today.getMonth(), 1)
})

const canGoToNextMonth = computed(() => {
  const nextMonth = new Date(currentMonth.value)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  return nextMonth <= maxDate
})

// 計算日曆日期
const calendarDates = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const endDate = new Date(lastDay)
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()))

  const dates = []
  const current = new Date(startDate)

  // eslint-disable-next-line no-unmodified-loop-condition
  while (current <= endDate) {
    const dateStr = formatDateString(current)
    const availabilityData = availability.value.find((a) => {
      // 處理不同的日期格式
      const aDate = typeof a.date === 'string' ? a.date : formatDateString(new Date(a.date))
      return aDate === dateStr
    })
    const originalData = originalAvailability.value.find((a) => {
      const aDate = typeof a.date === 'string' ? a.date : formatDateString(new Date(a.date))
      return aDate === dateStr
    })

    const hasChanged =
      originalData &&
      availabilityData &&
      originalData.is_available !== availabilityData.is_available

    const dateObj = {
      year: current.getFullYear(),
      month: current.getMonth(),
      day: current.getDate(),
      date: new Date(current),
      dateString: dateStr,
      isCurrentMonth: current.getMonth() === month,
      isPast: current < today,
      isToday: formatDateString(current) === formatDateString(today),
      isWeekend: current.getDay() === 0 || current.getDay() === 6,
      isAvailable: availabilityData?.is_available ?? true, // 預設可用
      isBooked: availabilityData?.is_booked || false,
      hasChanged,
      isSelected: isDateInRange(current, selectedRange.value),
      isInRange: isDateInRange(current, selectedRange.value),
      isRangeStart:
        selectedRange.value.start &&
        formatDateString(current) === formatDateString(selectedRange.value.start),
      isRangeEnd:
        selectedRange.value.end &&
        formatDateString(current) === formatDateString(selectedRange.value.end)
    }

    dates.push(dateObj)
    current.setDate(current.getDate() + 1)
  }

  return dates
})

// 檢查是否有變更
const hasChanges = computed(() => {
  return availability.value.some((item) => {
    const original = originalAvailability.value.find((o) => {
      const oDate = typeof o.date === 'string' ? o.date : formatDateString(new Date(o.date))
      const itemDate =
        typeof item.date === 'string' ? item.date : formatDateString(new Date(item.date))
      return oDate === itemDate
    })
    return original && original.is_available !== item.is_available
  })
})

// 待儲存的變更
const pendingChanges = computed(() => {
  const changes = []
  availability.value.forEach((item) => {
    const original = originalAvailability.value.find((o) => {
      const oDate = typeof o.date === 'string' ? o.date : formatDateString(new Date(o.date))
      const itemDate =
        typeof item.date === 'string' ? item.date : formatDateString(new Date(item.date))
      return oDate === itemDate
    })
    if (original && original.is_available !== item.is_available) {
      changes.push({
        date: typeof item.date === 'string' ? item.date : formatDateString(new Date(item.date)),
        oldStatus: original.is_available,
        newStatus: item.is_available
      })
    }
  })
  return changes.sort((a, b) => new Date(a.date) - new Date(b.date))
})

// 方法
const formatDateString = (date) => {
  return date.toISOString().split('T')[0]
}

const formatDisplayDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

const isDateInRange = (date, range) => {
  if (!range.start) return false
  if (!range.end) return formatDateString(date) === formatDateString(range.start)
  return date >= range.start && date <= range.end
}

const previousMonth = () => {
  if (canGoToPreviousMonth.value) {
    currentMonth.value.setMonth(currentMonth.value.getMonth() - 1)
    currentMonth.value = new Date(currentMonth.value)
  }
}

const nextMonth = () => {
  if (canGoToNextMonth.value) {
    currentMonth.value.setMonth(currentMonth.value.getMonth() + 1)
    currentMonth.value = new Date(currentMonth.value)
  }
}

const handleDateClick = (date) => {
  if (date.isPast || !date.isCurrentMonth || date.isBooked) {
    return
  }

  if (rangeSelectionMode.value) {
    handleRangeSelection(date)
  } else {
    toggleDateAvailability(date)
  }
}

const toggleDateAvailability = (date) => {
  const dateStr = date.dateString
  const item = availability.value.find((a) => {
    const aDate = typeof a.date === 'string' ? a.date : formatDateString(new Date(a.date))
    return aDate === dateStr
  })
  if (item) {
    item.is_available = !item.is_available
  }
}

const handleRangeSelection = (date) => {
  if (!selectedRange.value.start || selectedRange.value.end) {
    // 開始新的選擇
    selectedRange.value = { start: date.date, end: null }
  } else if (date.date >= selectedRange.value.start) {
    // 完成選擇
    selectedRange.value.end = date.date
  } else {
    selectedRange.value = { start: date.date, end: selectedRange.value.start }
  }
}

const selectDateRange = () => {
  rangeSelectionMode.value = !rangeSelectionMode.value
  if (!rangeSelectionMode.value) {
    selectedRange.value = { start: null, end: null }
  }
}

const setRangeAvailable = (isAvailable) => {
  if (!selectedRange.value.start) return

  const start = selectedRange.value.start
  const end = selectedRange.value.end || selectedRange.value.start

  const current = new Date(start)
  // eslint-disable-next-line no-unmodified-loop-condition
  while (current <= end) {
    const dateStr = formatDateString(current)
    const item = availability.value.find((a) => {
      const aDate = typeof a.date === 'string' ? a.date : formatDateString(new Date(a.date))
      return aDate === dateStr
    })
    if (item && !item.is_booked && current >= today) {
      item.is_available = isAvailable
    }
    current.setDate(current.getDate() + 1)
  }

  // 清除選擇
  selectedRange.value = { start: null, end: null }
  rangeSelectionMode.value = false
}

const saveChanges = async () => {
  if (!hasChanges.value) return

  saving.value = true

  try {
    const updates = pendingChanges.value.map((change) => ({
      date: change.date,
      available: change.newStatus
    }))

    const response = await $fetch('/api/admin/update-availability-v2', {
      method: 'POST',
      body: {
        homestayId: props.homestayId,
        updates
      }
    })

    if (response.success) {
      // 更新原始資料
      originalAvailability.value = JSON.parse(JSON.stringify(availability.value))
      emit('statusChanged', { success: true, changes: updates.length })
    } else {
      throw new Error(response.error || '儲存失敗')
    }
  } catch (error) {
    console.error('儲存變更失敗:', error)
    emit('statusChanged', { success: false, error: error.message })
  } finally {
    saving.value = false
  }
}

const fetchAvailability = async () => {
  loading.value = true
  error.value = null

  try {
    const year = currentMonth.value.getFullYear()
    const month = currentMonth.value.getMonth()

    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)

    const response = await $fetch('/api/homestay-availability-v2', {
      query: {
        homestayId: props.homestayId,
        startDate: formatDateString(startDate),
        endDate: formatDateString(endDate)
      }
    })

    if (response.success) {
      availability.value = response.data.availability
      originalAvailability.value = JSON.parse(JSON.stringify(response.data.availability))
    } else {
      error.value = response.error || '載入可用性資料失敗'
    }
  } catch (err) {
    console.error('載入可用性資料失敗:', err)
    error.value = '載入失敗，請稍後再試'
  } finally {
    loading.value = false
  }
}

// 監聽月份變化
watch(
  currentMonth,
  () => {
    fetchAvailability()
  },
  { deep: true }
)

// 組件掛載時載入資料
onMounted(() => {
  fetchAvailability()
})
</script>

<style lang="scss" scoped>
.admin-availability-calendar {
  background: $yp-surface;
  border-radius: $yp-radius-lg;
  box-shadow: $yp-shadow;
  overflow: hidden;
}

.cal-head {
  flex-wrap: wrap;

  &__icon {
    color: $yp-primary;
    font-size: 1.25rem;
  }

  &__desc {
    font-size: 0.875rem;
    color: $yp-muted;
    margin: 2px 0 0;
  }
}

.cal-body {
  padding: 16px;

  @media (min-width: $yp-bp-md) {
    padding: 20px;
  }
}

.cal-batch {
  margin-bottom: 16px;
  padding: 12px;
  background: $yp-surface-2;
  border-radius: $yp-radius;

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  &__info {
    margin-top: 10px;
    font-size: 0.875rem;
    font-weight: 500;
    color: $yp-muted;
  }
}

.cal-loading {
  padding: 8px 0;
}

.month-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  .nav-button {
    width: 40px;
    height: 40px;
    padding: 0;
    font-size: 1.25rem;
  }

  .current-month {
    font-weight: 700;
    color: $yp-ink;
    min-width: 128px;
    text-align: center;
    font-size: 1.0625rem;
  }
}

.weekdays-header {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
  margin-bottom: 4px;
}

.weekday {
  padding: 6px 0;
  text-align: center;
  font-weight: 700;
  color: $yp-muted;
  font-size: 0.8125rem;
}

.dates-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}

.date-cell {
  position: relative;
  min-height: 52px;
  padding: 6px 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: $yp-surface;
  border: 1px solid $yp-line;
  border-radius: $yp-radius-sm;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  @media (min-width: $yp-bp-md) {
    min-height: 64px;
  }

  &.other-month {
    color: $yp-subtle;
    background: $yp-bg;
    border-color: transparent;
    cursor: default;
  }

  &.past-date {
    color: $yp-subtle;
    background: $yp-bg;
    cursor: not-allowed;
  }

  // 可預訂
  &.available:not(.past-date) {
    background: $yp-success-soft;
    border-color: rgba($yp-success, 0.4);

    &:hover {
      border-color: $yp-success;
    }
  }

  // 業者設定不開放
  &.unavailable:not(.past-date) {
    background: $yp-surface-2;
    color: $yp-muted;
    border-color: $yp-line;

    .date-number {
      text-decoration: line-through;
    }

    &:hover {
      border-color: $yp-muted;
    }
  }

  // 已被預訂（不可修改）
  &.booked {
    background: $yp-danger-soft;
    border-color: rgba($yp-danger, 0.4);
    color: $yp-danger;
    cursor: not-allowed;
  }

  // 今天
  &.today {
    box-shadow: 0 0 0 2px $yp-primary;
    font-weight: 700;
  }

  // 尚未儲存的修改
  &.changed {
    border-color: $yp-warning;
    box-shadow: 0 0 0 2px rgba($yp-warning, 0.5);
  }

  // 範圍選擇
  &.selected,
  &.in-range {
    background: $yp-primary-soft;
    border-color: $yp-primary;
  }

  &.range-start,
  &.range-end {
    background: $yp-primary;
    border-color: $yp-primary;
    color: #fff;
  }
}

.date-number {
  font-family: $yp-font-num;
  font-size: 1rem;
  line-height: 1.2;
}

.date-indicator {
  margin-top: 4px;
}

.change-indicator {
  position: absolute;
  top: 3px;
  left: 3px;
  color: $yp-warning;
  font-size: 0.75rem;
  line-height: 1;
}

.indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;

  &.available-dot {
    background: $yp-success;
  }

  &.unavailable-dot {
    background: $yp-subtle;
  }

  &.booked-dot {
    background: $yp-danger;
  }
}

.range-start .indicator-dot,
.range-end .indicator-dot {
  background: #fff;
}

.calendar-legend {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid $yp-line;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: $yp-muted;
}

.legend-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;

  &.available-dot {
    background: $yp-success;
  }

  &.unavailable-dot {
    background: $yp-subtle;
  }

  &.booked-dot {
    background: $yp-danger;
  }

  &.changed-dot {
    background: $yp-warning;
  }
}

.changes-summary {
  margin-top: 16px;
  padding: 14px 16px;
  background: $yp-warning-soft;
  border-radius: $yp-radius;

  &__title {
    margin: 0 0 10px;
    color: darken($yp-warning, 12%);
    font-size: 0.9375rem;
    font-weight: 700;
  }
}

.changes-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;

  .change-date {
    font-weight: 500;
    color: $yp-ink;
  }

  .change-arrow {
    color: $yp-muted;
  }
}
</style>
