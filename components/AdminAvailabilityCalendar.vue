<template>
  <div class="admin-availability-calendar">
    <!-- 日曆標題和控制 -->
    <div class="calendar-header">
      <div class="header-left">
        <h3 class="calendar-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M2 2a1 1 0 0 0-1 1v1h14V3a1 1 0 0 0-1-1zm13 3H1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z"/>
          </svg>
          空房狀態管理
        </h3>
        <p class="calendar-subtitle">點擊日期切換可用/不可用狀態</p>
      </div>
      
      <div class="header-right">
        <button 
          v-if="hasChanges" 
          @click="saveChanges" 
          :disabled="saving"
          class="save-btn"
        >
          <svg v-if="saving" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1z"/>
          </svg>
          {{ saving ? '儲存中...' : '儲存變更' }}
        </button>
      </div>
    </div>

    <!-- 批量操作工具 -->
    <div class="batch-tools">
      <div class="batch-actions">
        <button @click="selectDateRange" class="batch-btn range-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5M.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5"/>
          </svg>
          {{ rangeSelectionMode ? '取消選擇' : '範圍選擇' }}
        </button>
        
        <div v-if="rangeSelectionMode" class="range-actions">
          <button @click="setRangeAvailable(true)" class="batch-btn available-btn">設為可用</button>
          <button @click="setRangeAvailable(false)" class="batch-btn unavailable-btn">設為不可用</button>
        </div>
      </div>
      
      <div class="selection-info" v-if="rangeSelectionMode && selectedRange.start">
        已選擇: {{ formatDisplayDate(selectedRange.start) }} 
        <span v-if="selectedRange.end">~ {{ formatDisplayDate(selectedRange.end) }}</span>
      </div>
    </div>

    <!-- 載入狀態 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>載入日曆資料中...</p>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button @click="fetchAvailability" class="retry-button">重新載入</button>
    </div>

    <!-- 月份導航 -->
    <div v-else class="month-nav-container">
      <div class="month-navigation">
        <button 
          @click="previousMonth" 
          :disabled="!canGoToPreviousMonth"
          class="nav-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
          </svg>
        </button>
        
        <span class="current-month">
          {{ currentMonth.getFullYear() }}年 {{ currentMonth.getMonth() + 1 }}月
        </span>
        
        <button 
          @click="nextMonth" 
          :disabled="!canGoToNextMonth"
          class="nav-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
          </svg>
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
              'available': date.isAvailable && !date.isPast,
              'unavailable': !date.isAvailable && !date.isPast,
              'booked': date.isBooked,
              'weekend': date.isWeekend,
              'today': date.isToday,
              'selected': date.isSelected,
              'in-range': date.isInRange,
              'range-start': date.isRangeStart,
              'range-end': date.isRangeEnd,
              'changed': date.hasChanged
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
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
              </svg>
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
      <h4>待儲存變更</h4>
      <div class="changes-list">
        <div v-for="change in pendingChanges" :key="change.date" class="change-item">
          <span class="change-date">{{ formatDisplayDate(new Date(change.date)) }}</span>
          <span class="change-arrow">→</span>
          <span :class="['change-status', change.newStatus ? 'available' : 'unavailable']">
            {{ change.newStatus ? '空房' : '不開放' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

// Props
const props = defineProps({
  homestayId: {
    type: String,
    required: true
  }
});

// Emits
const emit = defineEmits(['statusChanged']);

// 響應式資料
const currentMonth = ref(new Date());
const availability = ref([]);
const originalAvailability = ref([]);
const loading = ref(false);
const saving = ref(false);
const error = ref(null);

// 範圍選擇模式
const rangeSelectionMode = ref(false);
const selectedRange = ref({ start: null, end: null });

// 週標題
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

// 當前月份的邊界檢查
const today = new Date();
const maxDate = new Date();
maxDate.setMonth(maxDate.getMonth() + 6); // 半年內

const canGoToPreviousMonth = computed(() => {
  const prevMonth = new Date(currentMonth.value);
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  return prevMonth >= new Date(today.getFullYear(), today.getMonth(), 1);
});

const canGoToNextMonth = computed(() => {
  const nextMonth = new Date(currentMonth.value);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return nextMonth <= maxDate;
});

// 計算日曆日期
const calendarDates = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
  
  const dates = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dateStr = formatDateString(current);
    const availabilityData = availability.value.find(a => {
      // 處理不同的日期格式
      const aDate = typeof a.date === 'string' ? a.date : formatDateString(new Date(a.date));
      return aDate === dateStr;
    });
    const originalData = originalAvailability.value.find(a => {
      const aDate = typeof a.date === 'string' ? a.date : formatDateString(new Date(a.date));
      return aDate === dateStr;
    });
    
    const hasChanged = originalData && availabilityData && 
      originalData.is_available !== availabilityData.is_available;
    
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
      hasChanged: hasChanged,
      isSelected: isDateInRange(current, selectedRange.value),
      isInRange: isDateInRange(current, selectedRange.value),
      isRangeStart: selectedRange.value.start && formatDateString(current) === formatDateString(selectedRange.value.start),
      isRangeEnd: selectedRange.value.end && formatDateString(current) === formatDateString(selectedRange.value.end)
    };
    
    dates.push(dateObj);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
});

// 檢查是否有變更
const hasChanges = computed(() => {
  return availability.value.some(item => {
    const original = originalAvailability.value.find(o => {
      const oDate = typeof o.date === 'string' ? o.date : formatDateString(new Date(o.date));
      const itemDate = typeof item.date === 'string' ? item.date : formatDateString(new Date(item.date));
      return oDate === itemDate;
    });
    return original && original.is_available !== item.is_available;
  });
});

// 待儲存的變更
const pendingChanges = computed(() => {
  const changes = [];
  availability.value.forEach(item => {
    const original = originalAvailability.value.find(o => {
      const oDate = typeof o.date === 'string' ? o.date : formatDateString(new Date(o.date));
      const itemDate = typeof item.date === 'string' ? item.date : formatDateString(new Date(item.date));
      return oDate === itemDate;
    });
    if (original && original.is_available !== item.is_available) {
      changes.push({
        date: typeof item.date === 'string' ? item.date : formatDateString(new Date(item.date)),
        oldStatus: original.is_available,
        newStatus: item.is_available
      });
    }
  });
  return changes.sort((a, b) => new Date(a.date) - new Date(b.date));
});

// 方法
const formatDateString = (date) => {
  return date.toISOString().split('T')[0];
};

const formatDisplayDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

const isDateInRange = (date, range) => {
  if (!range.start) return false;
  if (!range.end) return formatDateString(date) === formatDateString(range.start);
  return date >= range.start && date <= range.end;
};

const previousMonth = () => {
  if (canGoToPreviousMonth.value) {
    currentMonth.value.setMonth(currentMonth.value.getMonth() - 1);
    currentMonth.value = new Date(currentMonth.value);
  }
};

const nextMonth = () => {
  if (canGoToNextMonth.value) {
    currentMonth.value.setMonth(currentMonth.value.getMonth() + 1);
    currentMonth.value = new Date(currentMonth.value);
  }
};

const handleDateClick = (date) => {
  if (date.isPast || !date.isCurrentMonth || date.isBooked) {
    return;
  }

  if (rangeSelectionMode.value) {
    handleRangeSelection(date);
  } else {
    toggleDateAvailability(date);
  }
};

const toggleDateAvailability = (date) => {
  const dateStr = date.dateString;
  const item = availability.value.find(a => {
    const aDate = typeof a.date === 'string' ? a.date : formatDateString(new Date(a.date));
    return aDate === dateStr;
  });
  if (item) {
    item.is_available = !item.is_available;
  }
};

const handleRangeSelection = (date) => {
  if (!selectedRange.value.start || selectedRange.value.end) {
    // 開始新的選擇
    selectedRange.value = { start: date.date, end: null };
  } else {
    // 完成選擇
    if (date.date >= selectedRange.value.start) {
      selectedRange.value.end = date.date;
    } else {
      selectedRange.value = { start: date.date, end: selectedRange.value.start };
    }
  }
};

const selectDateRange = () => {
  rangeSelectionMode.value = !rangeSelectionMode.value;
  if (!rangeSelectionMode.value) {
    selectedRange.value = { start: null, end: null };
  }
};

const setRangeAvailable = (isAvailable) => {
  if (!selectedRange.value.start) return;
  
  const start = selectedRange.value.start;
  const end = selectedRange.value.end || selectedRange.value.start;
  
  const current = new Date(start);
  while (current <= end) {
    const dateStr = formatDateString(current);
    const item = availability.value.find(a => {
      const aDate = typeof a.date === 'string' ? a.date : formatDateString(new Date(a.date));
      return aDate === dateStr;
    });
    if (item && !item.is_booked && current >= today) {
      item.is_available = isAvailable;
    }
    current.setDate(current.getDate() + 1);
  }
  
  // 清除選擇
  selectedRange.value = { start: null, end: null };
  rangeSelectionMode.value = false;
};

const saveChanges = async () => {
  if (!hasChanges.value) return;
  
  saving.value = true;
  
  try {
    const updates = pendingChanges.value.map(change => ({
      date: change.date,
      available: change.newStatus
    }));

    const response = await $fetch('/api/admin/update-availability-v2', {
      method: 'POST',
      body: {
        homestayId: props.homestayId,
        updates: updates
      }
    });

    if (response.success) {
      // 更新原始資料
      originalAvailability.value = JSON.parse(JSON.stringify(availability.value));
      emit('statusChanged', { success: true, changes: updates.length });
    } else {
      throw new Error(response.error || '儲存失敗');
    }
  } catch (error) {
    console.error('儲存變更失敗:', error);
    emit('statusChanged', { success: false, error: error.message });
  } finally {
    saving.value = false;
  }
};

const fetchAvailability = async () => {
  loading.value = true;
  error.value = null;

  try {
    const year = currentMonth.value.getFullYear();
    const month = currentMonth.value.getMonth();
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const response = await $fetch('/api/homestay-availability-v2', {
      query: {
        homestayId: props.homestayId,
        startDate: formatDateString(startDate),
        endDate: formatDateString(endDate)
      }
    });

    if (response.success) {
      availability.value = response.data.availability;
      originalAvailability.value = JSON.parse(JSON.stringify(response.data.availability));
    } else {
      error.value = response.error || '載入可用性資料失敗';
    }
  } catch (err) {
    console.error('載入可用性資料失敗:', err);
    error.value = '載入失敗，請稍後再試';
  } finally {
    loading.value = false;
  }
};

// 監聽月份變化
watch(currentMonth, () => {
  fetchAvailability();
}, { deep: true });

// 組件掛載時載入資料
onMounted(() => {
  fetchAvailability();
});
</script>

<style lang="scss" scoped>
.admin-availability-calendar {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f1f3f4;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
}

.header-left {
  .calendar-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 4px 0;
    
    svg {
      color: #3498db;
    }
  }
  
  .calendar-subtitle {
    font-size: 14px;
    color: #6c757d;
    margin: 0;
  }
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #20c997 0%, #28a745 100%);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.batch-tools {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.batch-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.range-btn {
    background: #3498db;
    color: white;
    
    &:hover {
      background: #2980b9;
    }
  }
  
  &.available-btn {
    background: #28a745;
    color: white;
    
    &:hover {
      background: #218838;
    }
  }
  
  &.unavailable-btn {
    background: #dc3545;
    color: white;
    
    &:hover {
      background: #c82333;
    }
  }
}

.range-actions {
  display: flex;
  gap: 8px;
}

.selection-info {
  margin-top: 12px;
  font-size: 14px;
  color: #495057;
  font-weight: 500;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.month-nav-container {
  .month-navigation {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
    
    .nav-button {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover:not(:disabled) {
        background: #e9ecef;
        border-color: #3498db;
        color: #3498db;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    .current-month {
      font-weight: 600;
      color: #2c3e50;
      min-width: 120px;
      text-align: center;
      font-size: 16px;
    }
  }
}

.weekdays-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 8px;
}

.weekday {
  padding: 10px;
  text-align: center;
  font-weight: 600;
  color: #6c757d;
  font-size: 14px;
  background: #f8f9fa;
}

.dates-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
}

.date-cell {
  background: white;
  padding: 8px 4px;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.other-month {
    color: #adb5bd;
    background: #f8f9fa;
    cursor: default;
  }
  
  &.past-date {
    color: #ced4da;
    background: #f8f9fa;
    cursor: not-allowed;
  }
  
  &.today {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
  }
  
  &.weekend:not(.past-date):not(.today) {
    background: #fff8e1;
  }
  
  &.available:not(.past-date) {
    background: #e8f5e8;
    border: 1px solid #28a745;
    
    &:hover {
      background: #d4edda;
      transform: scale(1.02);
    }
  }
  
  &.unavailable:not(.past-date) {
    background: #fff2f2;
    border: 1px solid #dc3545;
    
    &:hover {
      background: #f8d7da;
      transform: scale(1.02);
    }
  }
  
  &.booked {
    background: #ffe6e6;
    border: 1px solid #e74c3c;
    cursor: not-allowed;
  }
  
  &.changed {
    box-shadow: 0 0 0 2px #ffc107;
  }
  
  &.selected,
  &.in-range {
    background: rgba(52, 152, 219, 0.2);
    border: 1px solid #3498db;
  }
  
  &.range-start,
  &.range-end {
    background: #3498db;
    color: white;
  }
}

.date-number {
  font-size: 16px;
  margin-bottom: 4px;
}

.date-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
}

.change-indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  color: #ffc107;
}

.indicator-dot {
  width: 8px;
  height: 12px;
  border-radius: 50%;
  
  &.available-dot {
    background: #28a745;
  }
  
  &.unavailable-dot {
    background: #dc3545;
  }
  
  &.booked-dot {
    background: #e74c3c;
  }
}

.calendar-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6c757d;
}

.legend-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  
  &.available-dot {
    background: #28a745;
  }
  
  &.unavailable-dot {
    background: #dc3545;
  }
  
  &.booked-dot {
    background: #e74c3c;
  }
  
  &.changed-dot {
    background: #ffc107;
  }
}

.changes-summary {
  margin-top: 20px;
  padding: 16px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  
  h4 {
    margin: 0 0 12px 0;
    color: #856404;
    font-size: 16px;
  }
}

.changes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.change-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  
  .change-date {
    font-weight: 500;
    color: #495057;
  }
  
  .change-arrow {
    color: #6c757d;
  }
  
  .change-status {
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
    
    &.available {
      background: #d4edda;
      color: #155724;
    }
    
    &.unavailable {
      background: #f8d7da;
      color: #721c24;
    }
  }
}

.error-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.error-message {
  color: #e74c3c;
  margin-bottom: 16px;
}

.retry-button {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  
  &:hover {
    background: #2980b9;
  }
}

// 響應式設計
@media (max-width: 768px) {
  .admin-availability-calendar {
    padding: 16px;
  }
  
  .batch-actions {
    flex-direction: column;
    align-items: stretch;
    
    .range-actions {
      justify-content: center;
    }
  }
  
  .calendar-legend {
    gap: 12px;
  }
  
  .date-cell {
    min-height: 60px;
    padding: 6px 2px;
  }
  
  .changes-list {
    font-size: 13px;
  }
}
</style>