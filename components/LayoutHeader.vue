<template>
  <header class="yp-header" :class="{ 'is-scrolled': scrolled }">
    <div class="yp-header__inner">
      <NuxtLink :to="{ name: 'index' }" class="yp-header__logo" aria-label="宜蘭旅遊通 首頁">
        <img src="/logo.png" width="158" height="46" alt="宜蘭旅遊通" />
      </NuxtLink>

      <!-- 桌機導覽 -->
      <nav class="yp-header__nav" aria-label="主選單">
        <div
          v-for="item in menuItems"
          :key="item.title"
          class="yp-nav-group"
          :class="{ 'is-current': isGroupActive(item) }"
        >
          <NuxtLink :to="item.path" class="yp-nav-group__btn">
            {{ item.title }}
            <Icon name="ri:arrow-down-s-line" class="yp-nav-group__caret" />
          </NuxtLink>
          <div class="yp-nav-group__menu">
            <NuxtLink
              v-for="child in item.children"
              :key="child.path"
              :to="child.path"
              class="yp-nav-group__link"
            >
              <Icon :name="child.icon" class="yp-nav-group__icon" />
              <span>
                <b>{{ child.title }}</b>
                <small v-if="child.desc">{{ child.desc }}</small>
              </span>
            </NuxtLink>
            <NuxtLink
              v-if="item.title === '探索優惠' && userData?.userId"
              to="/userInfo"
              class="yp-nav-group__link"
            >
              <Icon name="ri:coupon-3-line" class="yp-nav-group__icon" />
              <span><b>我的優惠券</b><small>查看已領取的優惠</small></span>
            </NuxtLink>
          </div>
        </div>
      </nav>

      <div class="yp-header__actions">
        <!-- 編輯者（GitHub 登入）選單 -->
        <div
          v-if="userInfo"
          class="yp-user"
          @mouseenter="showEdit = true"
          @mouseleave="showEdit = false"
        >
          <button
            class="yp-user__btn"
            type="button"
            :aria-expanded="showEdit"
            @click="showEdit = !showEdit"
          >
            <img class="yp-user__avatar" :src="userInfo.avatar" alt="" />
            <span class="yp-user__name d-none d-lg-inline">{{ userInfo.nickname }}</span>
          </button>
          <transition name="yp-fade">
            <div v-show="showEdit" class="yp-user__menu">
              <div class="yp-user__head">
                <p class="yp-user__title">{{ userInfo.nickname }}</p>
                <p class="yp-user__email">{{ userInfo.email }}</p>
              </div>
              <NuxtLink to="/articles/create" class="yp-user__item">
                <Icon name="ri:add-circle-line" /> 新增優惠券
              </NuxtLink>
              <button type="button" class="yp-user__item is-danger" @click="handleLogout">
                <Icon name="ri:logout-box-r-line" /> 登出
              </button>
            </div>
          </transition>
        </div>

        <ClientOnly>
          <NuxtLink
            v-if="userData?.userId"
            to="/userInfo"
            class="yp-line-user"
            aria-label="我的優惠券"
          >
            <img v-if="userData.pictureUrl" :src="userData.pictureUrl" alt="" />
            <span v-else>{{ (userData.displayName || '我').slice(0, 1) }}</span>
          </NuxtLink>
          <a
            v-else-if="!userInfo"
            :href="lineLoginUrl"
            class="btn btn-line btn-sm yp-header__login"
          >
            LINE 登入
          </a>
        </ClientOnly>

        <button
          class="yp-header__burger"
          type="button"
          :aria-expanded="navOpen"
          aria-label="開啟選單"
          @click="navOpen = !navOpen"
        >
          <Icon :name="navOpen ? 'ri:close-line' : 'ri:menu-line'" />
        </button>
      </div>
    </div>

    <!-- 手機抽屜選單 -->
    <transition name="yp-drawer">
      <div v-show="navOpen" class="yp-drawer" @click.self="navOpen = false">
        <nav class="yp-drawer__panel" aria-label="手機選單">
          <section v-for="item in menuItems" :key="item.title" class="yp-drawer__group">
            <h2 class="yp-drawer__title">{{ item.title }}</h2>
            <NuxtLink
              v-for="child in item.children"
              :key="child.path"
              :to="child.path"
              class="yp-drawer__link"
              @click="navOpen = false"
            >
              <Icon :name="child.icon" />
              {{ child.title }}
              <Icon name="ri:arrow-right-s-line" class="text-secondary ms-auto" />
            </NuxtLink>
          </section>

          <div class="yp-drawer__stats" aria-label="站點數據">
            <div>
              <b>{{ displayVisitorCount }}</b
              ><span>人次造訪</span>
            </div>
            <div>
              <b>{{ partnerStores }}</b
              ><span>店家優惠</span>
            </div>
            <div>
              <b>{{ partnerHotels }}</b
              ><span>合作旅宿</span>
            </div>
          </div>

          <ClientOnly>
            <a v-if="!userData?.userId" :href="lineLoginUrl" class="btn btn-line w-100 mt-3">
              使用 LINE 登入領取優惠
            </a>
          </ClientOnly>
        </nav>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import useStore from '~~/store'
import useReferralStore from '~~/store/referral'
import { mainMenu } from '~/utils/site-nav'

const { data } = await useFetch('/api/whoami')
const userInfo = useState('userInfo')
const showEdit = ref(false)
const route = useRoute()

const store = useStore()
const userData = computed(() => store.getUserData)
const referral = useReferralStore()
const navOpen = ref(false)
const scrolled = ref(false)

const { partnerStores, partnerHotels, displayVisitorCount, animateVisitor } = useSiteStats()

const menuItems = mainMenu

const lineLoginUrl = computed(() => `/api/line/login?returnTo=${encodeURIComponent(route.path)}`)

const isGroupActive = (item) =>
  item.children.some((child) =>
    child.path === '/' ? route.path === '/' : route.path.startsWith(child.path)
  )

const onScroll = () => {
  scrolled.value = window.scrollY > 4
}

onMounted(() => {
  store.fetchAndSetUser()
  referral.setReferral(route.query)
  animateVisitor()
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})

watch(
  () => route.fullPath,
  () => {
    navOpen.value = false
    showEdit.value = false
  }
)

watch(navOpen, (open) => {
  if (typeof document !== 'undefined') {
    document.documentElement.style.overflow = open ? 'hidden' : ''
  }
})

watch(
  data,
  (newData) => {
    userInfo.value = newData
  },
  {
    immediate: true
  }
)

const handleLogout = () => {
  $fetch('/api/session', {
    method: 'DELETE'
  }).then(() => {
    userInfo.value = null
    navigateTo('/')
  })
}
</script>

<style lang="scss" scoped>
.yp-header {
  position: sticky;
  top: 0;
  z-index: 1020;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: saturate(1.4) blur(10px);
  border-bottom: 1px solid transparent;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &.is-scrolled {
    border-bottom-color: $yp-line;
    box-shadow: 0 4px 16px -12px rgba(19, 48, 58, 0.3);
  }

  &__inner {
    max-width: calc(var(--yp-content-width, #{$yp-container}) + 48px);
    margin: 0 auto;
    height: 60px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    gap: 32px;

    @media (min-width: $yp-bp-md) {
      height: $yp-header-h;
      padding: 0 24px;
    }
  }

  &__logo {
    flex: none;
    display: flex;

    img {
      height: 38px;
      width: auto;

      @media (min-width: $yp-bp-md) {
        height: 46px;
      }
    }
  }

  &__nav {
    display: none;
    flex: 1;
    gap: 4px;

    @media (min-width: $yp-bp-lg) {
      display: flex;
    }
  }

  &__actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__login {
    padding-left: 16px;
    padding-right: 16px;

    @media (max-width: #{$yp-bp-sm - 1px}) {
      display: none;
    }
  }

  &__burger {
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: $yp-ink;
    font-size: 24px;
    display: grid;
    place-items: center;

    &:hover {
      background: $yp-surface-2;
    }

    @media (min-width: $yp-bp-lg) {
      display: none;
    }
  }
}

.yp-nav-group {
  position: relative;

  &__btn {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 0.9375rem;
    font-weight: 500;
    color: #33515a;
  }

  &__caret {
    font-size: 16px;
    color: $yp-subtle;
    transition: transform 0.2s ease;
  }

  &.is-current &__btn {
    color: $yp-primary-ink;
    font-weight: 700;
  }

  &:hover &__btn,
  &:focus-within &__btn {
    background: $yp-surface-2;
    color: $yp-ink;
  }

  &:hover &__caret,
  &:focus-within &__caret {
    transform: rotate(180deg);
  }

  &__menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    min-width: 260px;
    padding: 8px;
    background: #fff;
    border-radius: $yp-radius-lg;
    border: 1px solid $yp-line;
    box-shadow: 0 20px 40px -20px rgba(19, 48, 58, 0.35);
    opacity: 0;
    visibility: hidden;
    transform: translateY(6px);
    transition: all 0.18s ease;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: -8px;
      height: 8px;
    }
  }

  &:hover &__menu,
  &:focus-within &__menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  &__link {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    color: $yp-ink;

    b {
      display: block;
      font-size: 0.9375rem;
      font-weight: 700;
    }

    small {
      display: block;
      font-size: 0.8125rem;
      color: $yp-muted;
    }

    &:hover,
    &.router-link-exact-active {
      background: $yp-primary-soft;
      color: $yp-ink;
    }
  }

  &__icon {
    flex: none;
    font-size: 20px;
    color: $yp-primary;
    margin-top: 2px;
  }
}

.yp-user {
  position: relative;

  &__btn {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 0;
    background: transparent;
    padding: 4px 8px 4px 4px;
    border-radius: $yp-radius-pill;
    color: $yp-ink;
    font-weight: 500;

    &:hover {
      background: $yp-surface-2;
    }
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  &__menu {
    position: absolute;
    right: 0;
    top: calc(100% + 6px);
    width: 240px;
    background: #fff;
    border-radius: $yp-radius-lg;
    border: 1px solid $yp-line;
    box-shadow: 0 20px 40px -20px rgba(19, 48, 58, 0.35);
    padding: 6px;
    z-index: 10;
  }

  &__head {
    padding: 10px 12px;
    border-bottom: 1px solid $yp-line;
    margin-bottom: 4px;
  }

  &__title {
    font-weight: 700;
    margin: 0;
  }

  &__email {
    font-size: 0.75rem;
    color: $yp-muted;
    margin: 0;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 9px 12px;
    border: 0;
    background: none;
    border-radius: 8px;
    color: $yp-ink;
    font-size: 0.9375rem;
    text-align: left;

    &:hover {
      background: $yp-surface-2;
    }

    &.is-danger {
      color: $yp-danger;

      &:hover {
        background: $yp-danger-soft;
      }
    }
  }
}

.yp-line-user {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  overflow: hidden;
  background: $yp-primary-soft;
  color: $yp-primary-ink;
  font-weight: 700;
  display: grid;
  place-items: center;
  box-shadow:
    0 0 0 2px #fff,
    0 0 0 3px $yp-line;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.yp-drawer {
  position: fixed;
  inset: 60px 0 0;
  z-index: 1030;
  background: rgba(19, 48, 58, 0.35);

  @media (min-width: $yp-bp-md) {
    inset: $yp-header-h 0 0;
  }

  @media (min-width: $yp-bp-lg) {
    display: none;
  }

  &__panel {
    background: $yp-bg;
    max-height: 100%;
    overflow-y: auto;
    padding: 12px 16px calc(24px + env(safe-area-inset-bottom));
  }

  &__group {
    background: #fff;
    border-radius: $yp-radius-lg;
    padding: 6px;
    margin-bottom: 10px;
  }

  &__title {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: $yp-subtle;
    padding: 8px 10px 4px;
    margin: 0;
  }

  &__link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 10px;
    border-radius: 10px;
    color: $yp-ink;
    font-size: 1rem;
    font-weight: 500;

    :deep(svg:first-child) {
      color: $yp-primary;
      font-size: 20px;
    }

    &.router-link-exact-active {
      background: $yp-primary-soft;
    }
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    background: #fff;
    border-radius: $yp-radius-lg;
    padding: 14px 6px;
    text-align: center;

    div + div {
      border-left: 1px solid $yp-line;
    }

    b {
      display: block;
      font-family: $yp-font-num;
      font-size: 1.25rem;
      font-weight: 600;
    }

    span {
      font-size: 0.75rem;
      color: $yp-muted;
    }
  }
}

.yp-fade-enter-active,
.yp-fade-leave-active {
  transition: opacity 0.15s ease;
}

.yp-fade-enter-from,
.yp-fade-leave-to {
  opacity: 0;
}

.yp-drawer-enter-active,
.yp-drawer-leave-active {
  transition: opacity 0.2s ease;

  .yp-drawer__panel {
    transition: transform 0.2s ease;
  }
}

.yp-drawer-enter-from,
.yp-drawer-leave-to {
  opacity: 0;

  .yp-drawer__panel {
    transform: translateY(-12px);
  }
}
</style>
