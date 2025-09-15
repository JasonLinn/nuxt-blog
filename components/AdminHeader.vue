<template>
  <div class="admin-header">
    <div class="admin-nav">
      <NuxtLink 
        to="/admin-review" 
        :class="['admin-nav-link', { active: isActive('/admin-review') }]"
      >
        民宿審核
      </NuxtLink>
      <NuxtLink 
        to="/admin/homestays" 
        :class="['admin-nav-link', { active: isActive('/admin/homestays') }]"
      >
        民宿管理系統
      </NuxtLink>
      <NuxtLink 
        to="/admin/places" 
        :class="['admin-nav-link', { active: isActive('/admin/places') }]"
      >
        地點管理
      </NuxtLink>
      <NuxtLink 
        to="/admin/features" 
        :class="['admin-nav-link', { active: isActive('/admin/features') }]"
      >
        特色項目管理
      </NuxtLink>
      <NuxtLink 
        to="/admin/yilan-activities" 
        :class="['admin-nav-link', { active: isActive('/admin/yilan-activities') }]"
      >
        宜蘭活動管理
      </NuxtLink>
      <button @click="logout" class="logout-btn">登出</button>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()

// 判斷當前路由是否為活躍狀態
const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}

// 登出函式
const logout = async () => {
  if (!confirm('確定要登出嗎？')) return
  
  try {
    const accessTokenCookie = useCookie('admin_access_token')
    accessTokenCookie.value = null
    await navigateTo('/admin-login')
  } catch (err) {
    console.error('登出失敗:', err)
    await navigateTo('/admin-login')
  }
}
</script>

<style lang="scss" scoped>
.admin-header {
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
  
  .admin-nav {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    max-width: 1400px;
    margin: 0 auto;
    
    .admin-nav-link {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
      white-space: nowrap;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        color: white;
        text-decoration: none;
      }
      
      &.active {
        background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
      }
    }
    
    .logout-btn {
      margin-left: auto;
      padding: 8px 16px;
      background-color: #ef4444;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      font-size: 14px;
      transition: background-color 0.2s;
      white-space: nowrap;
      
      &:hover {
        background-color: #dc2626;
      }
    }
  }
}

// 響應式設計
@media (max-width: 1024px) {
  .admin-header .admin-nav {
    padding: 12px 16px;
    gap: 8px;
    
    .admin-nav-link {
      padding: 6px 12px;
      font-size: 13px;
    }
    
    .logout-btn {
      padding: 6px 12px;
      font-size: 13px;
    }
  }
}

@media (max-width: 768px) {
  .admin-header .admin-nav {
    flex-wrap: wrap;
    gap: 6px;
    
    .admin-nav-link {
      padding: 6px 10px;
      font-size: 12px;
    }
    
    .logout-btn {
      padding: 6px 10px;
      font-size: 12px;
      margin-left: 0;
      order: -1;
      width: 100%;
    }
  }
}
</style>
