<template>
  <div class="admin-login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>🔐 管理員登入</h1>
          <p class="subtitle">民宿平台管理系統</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label class="form-label">管理員帳號</label>
            <input
              v-model="formData.username"
              type="text"
              class="form-input"
              placeholder="請輸入管理員帳號"
              required
              :disabled="logging"
            />
          </div>

          <div class="form-group">
            <label class="form-label">管理員密碼</label>
            <input
              v-model="formData.password"
              type="password"
              class="form-input"
              placeholder="請輸入管理員密碼"
              required
              :disabled="logging"
            />
          </div>

          <button
            type="submit"
            class="login-btn"
            :disabled="!canLogin || logging"
          >
            {{ logging ? '登入中...' : '登入系統' }}
          </button>
        </form>

        <!-- 錯誤訊息 -->
        <div v-if="errorMessage" class="error-message">
          <div class="error-icon">❌</div>
          <p>{{ errorMessage }}</p>
          <button @click="errorMessage = ''" class="dismiss-btn">確定</button>
        </div>

        <!-- 說明資訊 -->
        <div class="info-section">
          <h3>🔍 管理功能</h3>
          <ul class="function-list">
            <li>📋 審核新民宿申請</li>
            <li>✅ 批准或拒絕民宿註冊</li>
            <li>📊 查看民宿申請狀態</li>
            <li>📧 發送審核結果通知</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { navigateTo } from 'nuxt/app';

// SEO 設定
useHead({
  title: '管理員登入 - 民宿平台管理系統',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'description', content: '民宿平台管理員登入頁面' }
  ]
});

// 表單狀態
const logging = ref(false);
const errorMessage = ref('');

// 表單資料
const formData = ref({
  username: '',
  password: ''
});

// 驗證邏輯
const canLogin = computed(() => {
  return formData.value.username.trim() && formData.value.password.trim();
});

// 處理登入
const handleLogin = async () => {
  if (!canLogin.value) return;
  
  logging.value = true;
  errorMessage.value = '';
  
  try {
    const response = await $fetch('/api/admin-login', {
      method: 'POST',
      body: {
        username: formData.value.username.trim(),
        password: formData.value.password
      }
    });
    
    if (response.success) {
      // 登入成功，跳轉到管理頁面
      await navigateTo('/admin-review');
    } else {
      errorMessage.value = response.message || '登入失敗';
    }
  } catch (error) {
    console.error('管理員登入錯誤:', error);
    errorMessage.value = error.data?.message || '帳號或密碼錯誤';
  } finally {
    logging.value = false;
  }
};

// 檢查是否已登入
onMounted(async () => {
  try {
    const response = await $fetch('/api/admin-auth');
    if (response.success) {
      await navigateTo('/admin-review');
    }
  } catch (error) {
    // 未登入，保持在登入頁面
  }
});
</script>

<style scoped lang="scss">
.admin-login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  background: white;
  border-radius: 15px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  position: relative;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
  
  h1 {
    font-size: 1.8rem;
    margin-bottom: 8px;
    color: #2c3e50;
    font-weight: 700;
  }
  
  .subtitle {
    color: #7f8c8d;
    font-size: 0.95rem;
  }
}

.login-form {
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
  
  &:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
  }
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

.error-message {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  margin-bottom: 20px;
  
  .error-icon {
    font-size: 2rem;
    margin-bottom: 10px;
  }
  
  p {
    color: #721c24;
    margin-bottom: 15px;
    font-weight: 500;
  }
  
  .dismiss-btn {
    background: #dc3545;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.3s ease;
    
    &:hover {
      background: #c82333;
    }
  }
}

.info-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #3498db;
  
  h3 {
    margin-bottom: 15px;
    color: #2c3e50;
    font-size: 1.1rem;
  }
  
  .function-list {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      padding: 8px 0;
      color: #5a6c7d;
      font-size: 0.95rem;
      border-bottom: 1px solid #e9ecef;
      
      &:last-child {
        border-bottom: none;
      }
    }
  }
}

// 響應式設計
@media (max-width: 480px) {
  .admin-login-page {
    padding: 15px;
  }
  
  .login-card {
    padding: 30px 25px;
  }
  
  .login-header h1 {
    font-size: 1.6rem;
  }
}
</style> 