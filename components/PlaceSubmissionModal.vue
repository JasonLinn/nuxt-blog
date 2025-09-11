<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">推薦新地點</h2>
        <button 
          @click="closeModal" 
          class="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>

      <form @submit.prevent="submitPlace" class="space-y-4">
        <!-- 地點名稱 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">地點名稱 *</label>
          <input
            v-model="formData.name"
            type="text"
            required
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="請輸入地點名稱"
          />
        </div>

        <!-- 地點描述 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">地點描述</label>
          <textarea
            v-model="formData.description"
            rows="3"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="請簡述這個地點的特色..."
          ></textarea>
        </div>

        <!-- 地址 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">地址</label>
          <input
            v-model="formData.address"
            type="text"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="請輸入完整地址"
          />
        </div>

        <!-- 座標 (可從地圖選取) -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">緯度 *</label>
            <input
              v-model.number="formData.latitude"
              type="number"
              step="any"
              required
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 24.7736"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">經度 *</label>
            <input
              v-model.number="formData.longitude"
              type="number"
              step="any"
              required
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 121.7741"
            />
          </div>
        </div>

        <!-- 從地圖選取座標按鈕 -->
        <button
          type="button"
          @click="selectFromMap"
          class="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
        >
          📍 從地圖選取座標
        </button>

        <!-- 分類 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">地點分類 *</label>
          <select
            v-model="formData.category_id"
            required
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">請選擇分類</option>
            <option value="1">美食餐廳</option>
            <option value="2">觀光景點</option>
            <option value="3">住宿飯店</option>
            <option value="4">購物商店</option>
            <option value="5">休閒娛樂</option>
            <option value="6">交通運輸</option>
            <option value="7">生活服務</option>
            <option value="8">其他</option>
          </select>
        </div>

        <!-- Google Place ID (可選) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Google Place ID (可選)</label>
          <input
            v-model="formData.google_place_id"
            type="text"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="如果知道的話可以填入..."
          />
          <p class="text-xs text-gray-500 mt-1">填入後系統會自動獲取 Google 地點資訊</p>
        </div>

        <!-- 聯絡資訊 -->
        <div class="grid grid-cols-1 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">官方網站</label>
            <input
              v-model="formData.website"
              type="url"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">聯絡電話</label>
            <input
              v-model="formData.phone"
              type="tel"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 03-123-4567"
            />
          </div>
        </div>

        <!-- 營業時間 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">營業時間</label>
          <textarea
            v-model="formData.opening_hours_text"
            rows="2"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 週一至週日 09:00-21:00"
          ></textarea>
        </div>

        <!-- 提交須知 -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800">提交須知</h3>
              <div class="mt-2 text-sm text-yellow-700">
                <ul class="list-disc pl-5 space-y-1">
                  <li>您推薦的地點將送交管理員審核</li>
                  <li>審核通過後才會在地圖上顯示</li>
                  <li>請確保資訊正確且完整</li>
                  <li>我們會在 1-3 個工作天內完成審核</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- 提交按鈕 -->
        <div class="flex gap-3 pt-4">
          <button
            type="button"
            @click="closeModal"
            class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            :disabled="isSubmitting"
          >
            取消
          </button>
          <button
            type="submit"
            class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? '提交中...' : '提交推薦' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'submitted']);

const isSubmitting = ref(false);

// 表單資料
const formData = ref({
  name: '',
  description: '',
  address: '',
  latitude: null,
  longitude: null,
  category_id: '',
  google_place_id: '',
  website: '',
  phone: '',
  opening_hours_text: ''
});

// 關閉對話框
const closeModal = () => {
  if (!isSubmitting.value) {
    resetForm();
    emit('close');
  }
};

// 重置表單
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    address: '',
    latitude: null,
    longitude: null,
    category_id: '',
    google_place_id: '',
    website: '',
    phone: '',
    opening_hours_text: ''
  };
};

// 從地圖選取座標
const selectFromMap = () => {
  alert('請在地圖上點擊選取位置\n(此功能將在接下來整合)');
  // TODO: 實作地圖選點功能
  // 可以發送事件給父組件開啟地圖選點模式
  emit('selectLocation');
};

// 提交地點
const submitPlace = async () => {
  try {
    isSubmitting.value = true;
    
    // 準備提交資料
    const submitData = {
      ...formData.value,
      status: 'pending', // 設為待審核狀態
      is_featured: false,
      is_private: false,
      auto_import_photo: true // 自動匯入 Google 照片
    };

    // 如果有營業時間文字，嘗試解析為 JSON 格式
    if (submitData.opening_hours_text) {
      // 簡單的時間格式解析，實際可以更複雜
      submitData.opening_hours = {
        text: submitData.opening_hours_text
      };
      delete submitData.opening_hours_text;
    }

    console.log('提交地點資料:', submitData);

    // 呼叫 API
    const response = await $fetch('/api/places', {
      method: 'POST',
      body: submitData
    });

    if (response.success) {
      // 顯示成功訊息
      alert('地點推薦已提交！\n感謝您的推薦，我們會在 1-3 個工作天內審核完成。');
      
      // 發送提交完成事件
      emit('submitted', response.data);
      
      // 關閉對話框
      closeModal();
    } else {
      throw new Error(response.message || '提交失敗');
    }

  } catch (error) {
    console.error('提交地點失敗:', error);
    alert('提交失敗：' + (error.data?.message || error.message || '未知錯誤'));
  } finally {
    isSubmitting.value = false;
  }
};

// 監聽 ESC 鍵關閉對話框
onMounted(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape' && props.isOpen) {
      closeModal();
    }
  };
  
  document.addEventListener('keydown', handleEscape);
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape);
  });
});
</script>
