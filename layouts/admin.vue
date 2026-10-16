<template>
  <div class="yp-admin">
    <aside class="yp-admin-sidebar">
      <div class="yp-admin-sidebar__brand">
        <NuxtLink to="/admin/homestays" class="d-flex align-items-center gap-2">
          <img src="/logo.png" alt="宜蘭旅遊通" />
        </NuxtLink>
        <span class="yp-admin-sidebar__badge">管理後台</span>
      </div>
      <nav class="yp-admin-sidebar__nav" aria-label="後台選單">
        <template v-for="section in adminMenu" :key="section.group">
          <div class="yp-admin-sidebar__group">{{ section.group }}</div>
          <NuxtLink
            v-for="item in section.items"
            :key="item.path"
            :to="item.path"
            class="yp-admin-sidebar__link"
            :class="{ 'is-active': isActive(item.path) }"
          >
            <Icon :name="item.icon" class="icon" />
            {{ item.title }}
          </NuxtLink>
        </template>
      </nav>
      <div class="yp-admin-sidebar__footer">
        <NuxtLink to="/" class="yp-admin-sidebar__link" target="_blank">
          <Icon name="ri:external-link-line" class="icon" /> 前往前台
        </NuxtLink>
        <button
          type="button"
          class="yp-admin-sidebar__link w-100 text-danger border-0 bg-transparent"
          @click="logout"
        >
          <Icon name="ri:logout-box-r-line" class="icon" /> 登出
        </button>
      </div>
    </aside>
    <main class="yp-admin-main">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { adminMenu } from '~/utils/site-nav'

const route = useRoute()

const isActive = (path) => route.path === path || route.path.startsWith(`${path}/`)

const logout = async () => {
  if (!confirm('確定要登出嗎？')) return

  try {
    const accessTokenCookie = useCookie('admin_access_token')
    accessTokenCookie.value = null
    await navigateTo('/admin-login')
  } catch (err) {
    console.error('登出失敗:', err)
  }
}
</script>
