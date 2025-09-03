<template>
  <div class="availability-calendar">
    <!-- 日曆標題 -->
    <div class="calendar-header">
      <h3 class="calendar-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M2 2a1 1 0 0 0-1 1v1h14V3a1 1 0 0 0-1-1zm13 3H1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z"/>
        </svg>
        空房狀況
      </h3>
      
      <!-- 月份導航 -->
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
    </div>

    <!-- 載入狀態 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>載入日曆中...</p>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button @click="fetchAvailability" class="retry-button">重新載入</button>
    </div>

    <!-- 日曆主體 -->
    <div v-else class="calendar-body">
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
            'today': date.isToday
          }"
        >
          <div class="date-number">{{ date.day }}</div>
          
          <!-- 狀態指示器 -->
          <div v-if="date.isCurrentMonth && !date.isPast" class="date-indicator">
            <div v-if="date.isBooked" class="indicator-dot booked-dot"></div>
            <div v-else-if="!date.isAvailable" class="indicator-dot unavailable-dot"></div>
            <div v-else class="indicator-dot available-dot"></div>
          </div>
        </div>
      </div>

      <!-- 圖例 -->
      <div class="calendar-legend">
        <div class="legend-item">
          <div class="legend-indicator available-dot"></div>
          <span>空房</span>
        </div>
        <div class="legend-item">
          <div class="legend-indicator unavailable-dot"></div>
          <span>不開放</span>
        </div>
        <div class="legend-item">
          <div class="legend-indicator booked-dot"></div>
          <span>客滿</span>
        </div>
      </div>

      <!-- 簡化說明 -->
      <div class="calendar-info">
        <p class="info-text">綠色 = 空房，紅色 = 客滿</p>
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
  },
  viewOnly: {
    type: Boolean,
    default: true
  }
});

// Emits (簡化為只有檢視模式)
const emit = defineEmits([]);

// 響應式資料
const currentMonth = ref(new Date());
const availability = ref([]);
const loading = ref(false);
const error = ref(null);

// 週標題
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

// 當前月份的邊界檢查
const today = new Date();
const maxDate = new Date();
maxDate.setMonth(maxDate.getMonth() + 6); // 最多顯示6個月後

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
  
  // 獲取當月第一天和最後一天
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 獲取日曆顯示的第一天（可能是上個月的日期）
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  // 獲取日曆顯示的最後一天（可能是下個月的日期）
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
  
  const dates = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dateStr = formatDateString(current);
    const availabilityData = availability.value.find(a => a.date === dateStr);
    
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
      isAvailable: availabilityData?.is_available || false,
      isBooked: availabilityData?.is_booked || false
    };
    
    dates.push(dateObj);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
});

// 移除價格和選擇相關的計算屬性

// 方法
const formatDateString = (date) => {
  return date.toISOString().split('T')[0];
};

// 簡化的格式化方法
const formatDisplayDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
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

// 移除所有與選擇和預訂相關的方法

const fetchAvailability = async () => {
  loading.value = true;
  error.value = null;

  try {
    const year = currentMonth.value.getFullYear();
    const month = currentMonth.value.getMonth();
    
    // 取得當月第一天和最後一天
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
.availability-calendar {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  max-width: 500px;
  margin: 0 auto;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f1f3f4;
}

.calendar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  
  svg {
    color: #3498db;
  }
}

.month-navigation {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-button {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
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
  min-width: 100px;
  text-align: center;
}

// 載入和錯誤狀態
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

// 日曆主體
.weekdays-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 8px;
}

.weekday {
  padding: 8px;
  text-align: center;
  font-weight: 600;
  color: #6c757d;
  font-size: 14px;
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
  min-height: 60px;
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
    cursor: not-allowed;
  }
  
  &.booked {
    background: #ffe6e6;
    border: 1px solid #e74c3c;
    cursor: not-allowed;
  }
  
  // 移除選擇相關樣式
}

.date-number {
  font-size: 16px;
  margin-bottom: 2px;
}

// 移除價格顯示樣式

.date-indicator {
  position: absolute;
  bottom: 4px;
  right: 4px;
}

.indicator-dot {
  width: 6px;
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

// 圖例
.calendar-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6c757d;
}

.legend-indicator {
  width: 8px;
  height: 8px;
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

// 簡化說明樣式
.calendar-info {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.info-text {
  margin: 0;
  font-size: 14px;
  color: #6c757d;
}

// 響應式設計
@media (max-width: 768px) {
  .availability-calendar {
    padding: 16px;
    margin: 0;
  }
  
  .calendar-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .date-range-display {
    grid-template-columns: 1fr;
  }
  
  .date-actions {
    flex-direction: column;
  }
  
  .calendar-legend {
    flex-wrap: wrap;
    gap: 12px;
  }
}
</style>