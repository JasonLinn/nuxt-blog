<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">民宿會員登入</h1>
        <p class="login-subtitle">使用您的民宿編號登入管理後台</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="account" class="form-label">民宿編號</label>
          <input
            id="account"
            v-model="form.account"
            type="text"
            placeholder="請輸入您的民宿編號"
            class="form-input"
            :disabled="loading"
            required
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">密碼</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="請輸入密碼 (B + 民宿編號)"
            class="form-input"
            :disabled="loading"
            required
          />
          <div class="password-hint">
            密碼格式：B + 您的民宿編號（例如：B2591）
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button
          type="submit"
          class="login-button"
          :disabled="loading"
        >
          {{ loading ? '登入中...' : '登入管理後台' }}
        </button>
      </form>

      <div class="login-footer">
        <div class="back-link">
          <NuxtLink to="/homestay-list" class="link">返回民宿列表</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { navigateTo } from 'nuxt/app';

// SEO設定
useHead({
  title: '民宿會員登入 - 管理後台',
  meta: [
    { name: 'description', content: '民宿業者專用登入頁面，管理您的民宿資訊' }
  ]
});

// 表單狀態
const form = ref({
  account: '',
  password: ''
});

const loading = ref(false);
const error = ref('');

// 處理登入
const handleLogin = async () => {
  try {
    loading.value = true;
    error.value = '';

    if (!form.value.account.trim() || !form.value.password.trim()) {
      error.value = '請輸入民宿編號和密碼';
      return;
    }

    const response = await $fetch('/api/homestay-login', {
      method: 'POST',
      body: {
        account: form.value.account.trim(),
        password: form.value.password.trim()
      }
    });

    if (response.success) {
      // 登入成功，跳轉到管理後台
      await navigateTo('/homestay-admin');
    }

  } catch (err) {
    console.error('登入錯誤:', err);
    error.value = err.data?.message || err.message || '登入失敗，請檢查帳號密碼';
  } finally {
    loading.value = false;
  }
};

// 自動填入密碼提示
watch(() => form.value.account, (newAccount) => {
  if (newAccount && !form.value.password.startsWith('B')) {
    // 當輸入民宿編號時，自動提示密碼格式
    if (newAccount.length > 0) {
      // 可以選擇性地自動填入密碼前綴
      // form.value.password = `B${newAccount}`;
    }
  }
});
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 8px;
}

.login-subtitle {
  color: #718096;
  font-size: 16px;
  margin: 0;
}

.login-form {
  .form-group {
    margin-bottom: 24px;
  }

  .form-label {
    display: block;
    margin-bottom: 8px;
    color: #2d3748;
    font-weight: 600;
    font-size: 14px;
  }

  .form-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.3s ease;
    background: #f7fafc;

    &:focus {
      outline: none;
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    &:disabled {
      background: #f7fafc;
      cursor: not-allowed;
      opacity: 0.6;
    }

    &::placeholder {
      color: #a0aec0;
    }
  }

  .password-hint {
    margin-top: 8px;
    font-size: 12px;
    color: #718096;
    background: #f7fafc;
    padding: 8px 12px;
    border-radius: 6px;
    border-left: 3px solid #667eea;
  }
}

.error-message {
  color: #e53e3e;
  background: #fed7d7;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 24px;
  border-left: 4px solid #e53e3e;
}

.login-button {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.login-footer {
  margin-top: 32px;
  text-align: center;
}

.back-link .link {
  color: #718096;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;

  &:hover {
    color: #667eea;
  }
}

// 響應式設計
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    padding: 24px;
  }

  .login-title {
    font-size: 24px;
  }
}
</style> 