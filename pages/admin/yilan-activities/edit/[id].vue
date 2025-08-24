<template>
  <div class="container mx-auto p-6 max-w-4xl">
    <div class="mb-6">
      <div class="flex items-center gap-4 mb-4">
        <button 
          @click="$router.back()" 
          class="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          返回詳情
        </button>
        <div class="h-6 border-l border-gray-300"></div>
        <h1 class="text-2xl font-bold text-gray-800">編輯活動</h1>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>

    <div v-else-if="!activity" class="text-center py-12">
      <p class="text-gray-500">找不到此活動</p>
    </div>

    <form v-else @submit.prevent="updateActivity" class="space-y-8">
      <!-- 基本資訊 -->
      <div class="bg-white shadow-lg rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">基本資訊</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              活動標題 <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.title" 
              type="text" 
              required 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              活動簡介 <span class="text-red-500">*</span>
            </label>
            <textarea 
              v-model="form.description" 
              required 
              rows="6"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            ></textarea>
            <p class="text-sm text-gray-500 mt-1">{{ form.description?.length || 0 }}/1000 字</p>
          </div>
        </div>
      </div>

      <!-- 活動詳情 -->
      <div class="bg-white shadow-lg rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">活動詳情</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              活動日期 <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.event_date" 
              type="date" 
              required 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">活動時間</label>
            <input 
              v-model="form.event_time" 
              type="time" 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">活動地點</label>
            <input 
              v-model="form.location" 
              type="text" 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">活動類型</label>
            <select 
              v-model="form.activity_type" 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">請選擇活動類型</option>
              <option value="文化藝術">文化藝術</option>
              <option value="觀光旅遊">觀光旅遊</option>
              <option value="美食餐飲">美食餐飲</option>
              <option value="戶外運動">戶外運動</option>
              <option value="親子活動">親子活動</option>
              <option value="節慶慶典">節慶慶典</option>
              <option value="教育講座">教育講座</option>
              <option value="商業促銷">商業促銷</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 主辦單位資訊 -->
      <div class="bg-white shadow-lg rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">主辦單位資訊</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              主辦單位名稱 <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.organizer_name" 
              type="text" 
              required 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              聯絡信箱 <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.organizer_email" 
              type="email" 
              required 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">聯絡電話</label>
            <input 
              v-model="form.organizer_phone" 
              type="tel" 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">其他聯絡方式</label>
            <textarea 
              v-model="form.contact_info" 
              rows="3"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- 活動圖片 -->
      <div class="bg-white shadow-lg rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">活動圖片</h2>
        
        <!-- 現有圖片 -->
        <div v-if="form.images && form.images.length" class="mb-6">
          <h3 class="text-sm font-medium text-gray-700 mb-3">現有圖片</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div 
              v-for="(image, index) in form.images" 
              :key="index"
              class="relative aspect-video bg-gray-100 rounded-lg overflow-hidden"
            >
              <img :src="image" class="w-full h-full object-cover" />
              <button 
                type="button"
                @click="removeExistingImage(index)"
                class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
        
        <!-- 上傳新圖片 -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              上傳新圖片 (最多 5 張)
            </label>
            <input 
              ref="fileInput"
              type="file" 
              multiple 
              accept="image/*"
              @change="handleFileUpload"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p class="text-sm text-gray-500 mt-1">支援 JPG、PNG 格式，單張圖片不超過 5MB</p>
          </div>
          
          <!-- 新圖片預覽 -->
          <div v-if="newImagePreview.length" class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div 
              v-for="(preview, index) in newImagePreview" 
              :key="index"
              class="relative aspect-video bg-gray-100 rounded-lg overflow-hidden"
            >
              <img :src="preview.url" class="w-full h-full object-cover" />
              <button 
                type="button"
                @click="removeNewImage(index)"
                class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 管理員備註 -->
      <div class="bg-white shadow-lg rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">管理員備註</h2>
        <textarea 
          v-model="form.admin_notes" 
          rows="4"
          placeholder="管理員內部備註..."
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        ></textarea>
      </div>

      <!-- 提交按鈕 -->
      <div class="flex justify-end gap-4">
        <button 
          type="button"
          @click="$router.back()"
          class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
        <button 
          type="submit" 
          :disabled="submitting"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="submitting" class="flex items-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            更新中...
          </span>
          <span v-else>儲存更新</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'admin-auth',
  layout: 'default'
})

const route = useRoute()
const router = useRouter()

const activity = ref(null)
const loading = ref(true)
const submitting = ref(false)
const newImageFiles = ref([])
const newImagePreview = ref([])
const deletedImages = ref([])
const fileInput = ref(null)

const form = ref({
  title: '',
  description: '',
  event_date: '',
  event_time: '',
  location: '',
  activity_type: '',
  organizer_name: '',
  organizer_email: '',
  organizer_phone: '',
  contact_info: '',
  admin_notes: '',
  images: []
})

const fetchActivity = async () => {
  try {
    loading.value = true
    const response = await $fetch(`/api/yilan-activities/${route.params.id}`)
    activity.value = response.data
    
    // 填充表單
    Object.keys(form.value).forEach(key => {
      if (activity.value[key] !== null && activity.value[key] !== undefined) {
        form.value[key] = activity.value[key]
      }
    })
    
    // 處理日期格式
    if (activity.value.event_date) {
      form.value.event_date = new Date(activity.value.event_date).toISOString().split('T')[0]
    }
    
  } catch (error) {
    console.error('Failed to fetch activity:', error)
    activity.value = null
  } finally {
    loading.value = false
  }
}

const handleFileUpload = (event) => {
  const files = Array.from(event.target.files)
  const totalImages = (form.value.images?.length || 0) + newImageFiles.value.length + files.length
  
  if (totalImages > 5) {
    alert('最多只能有 5 張圖片')
    return
  }
  
  files.forEach(file => {
    if (file.size > 5 * 1024 * 1024) {
      alert(`圖片 ${file.name} 超過 5MB，請選擇較小的檔案`)
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      newImagePreview.value.push({
        url: e.target.result,
        file: file
      })
      newImageFiles.value.push(file)
    }
    reader.readAsDataURL(file)
  })
  
  event.target.value = ''
}

const removeExistingImage = (index) => {
  const removedImage = form.value.images[index]
  deletedImages.value.push(removedImage)
  form.value.images.splice(index, 1)
}

const removeNewImage = (index) => {
  newImagePreview.value.splice(index, 1)
  newImageFiles.value.splice(index, 1)
}

const updateActivity = async () => {
  try {
    submitting.value = true
    
    const formData = new FormData()
    
    // 添加基本表單數據
    Object.keys(form.value).forEach(key => {
      if (form.value[key] !== null && form.value[key] !== undefined && key !== 'images') {
        formData.append(key, form.value[key])
      }
    })
    
    // 添加現有圖片（去除已刪除的）
    const remainingImages = form.value.images || []
    formData.append('images', JSON.stringify(remainingImages))
    
    // 添加要刪除的圖片
    deletedImages.value.forEach(image => {
      formData.append('deleteImages', image)
    })
    
    // 添加新圖片文件
    newImageFiles.value.forEach(file => {
      formData.append('images', file)
    })
    
    await $fetch(`/api/yilan-activities/${route.params.id}`, {
      method: 'PATCH',
      body: formData
    })
    
    router.push(`/admin/yilan-activities/${route.params.id}`)
    
  } catch (error) {
    console.error('Failed to update activity:', error)
    alert('更新失敗，請稍後再試')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchActivity()
})
</script>
