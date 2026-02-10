<template>
  <header class="flex w-full justify-center container relative z-50">
    <div id="sidemenu">
      <button class="sidemenu__btn" v-on:click="navOpen=!navOpen" v-bind:class="{active:navOpen}">
        <span class="top"></span>
        <span class="mid"></span>
        <span class="bottom"></span>
      </button>
      <transition name="translateX">
        <nav v-show="navOpen">
          <div class="sidemenu__wrapper">
            <ul class="sidemenu__list">
              <li v-for="(item, index) in menuItems" :key="index" class="sidemenu__item">
                <div class="sidemenu__title" @click="toggleMobileSubmenu(index)">
                  <span>{{ item.title }}</span>
                  <Icon name="ri:arrow-down-s-line" class="transition-transform duration-300" :class="{ 'rotate-180': item.isOpen }" v-if="item.children" />
                </div>
                <transition name="slide-down">
                  <ul v-show="item.isOpen" class="sidemenu__sublist">
                     <li v-for="(child, cIndex) in item.children" :key="cIndex" class="sidemenu__subitem">
                        <NuxtLink :to="child.path" @click="navOpen = false">
                           {{ child.title }}
                        </NuxtLink>
                     </li>
                     <li v-if="item.title === '探索優惠' && userData?.userId" class="sidemenu__subitem">
                        <NuxtLink to="/userInfo" @click="navOpen = false">
                          查看已領
                        </NuxtLink>
                     </li>
                  </ul>
                </transition>
              </li>
              
               <li v-if="!userData?.userId" class="sidemenu__item" @click="navOpen = false">
                <NuxtLink
                  class="sidemenu__link"
                  :to="`https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=2005661804&redirect_uri=https://${host}/line_callback&state=${route.path}&bot_prompt=normal&scope=openid%20email%20profile`"
                >
                  登入LINE
                </NuxtLink>
              </li>
            </ul>
          </div>
        </nav>
      </transition>
    </div>

    <nav class="index-nav flex w-full max-w-7xl items-center justify-between px-6 py-2">
      <div class="nav-wrapper flex items-center">
        <NuxtLink :to="{ name: 'index' }">
          <img src="/logo.jpg" width="200" alt="宜蘭旅遊通">
        </NuxtLink>
      </div>

      <!-- Desktop Navigation Links -->
      <div class="nav-links">
        <div v-for="(item, index) in menuItems" :key="index" class="nav-item-group">
          <div class="nav-link-btn">
            {{ item.title }}
            <Icon name="ri:arrow-down-s-line" class="nav-icon" />
          </div>
          
          <!-- Dropdown Menu -->
          <div class="nav-dropdown">
             <div class="dropdown-content">
                <NuxtLink 
                  v-for="(child, cIndex) in item.children" 
                  :key="cIndex" 
                  :to="child.path"
                  class="dropdown-link"
                >
                  {{ child.title }}
                </NuxtLink>
                 <NuxtLink 
                  v-if="item.title === '探索優惠' && userData?.userId" 
                  to="/userInfo"
                  class="dropdown-link"
                >
                  查看已領
                </NuxtLink>
             </div>
          </div>
        </div>
      </div>

      <!-- User Info / Login -->
      <div class="flex items-center gap-4">
        <!-- User Avatar Dropdown -->
        <div v-if="userInfo" class="user-info group relative z-50">
          <div class="avatar cursor-pointer py-2 flex items-center gap-2" @mouseenter="showEdit = true" @mouseleave="showEdit = false">
             <img
              class="user-img"
              :src="userInfo.avatar"
              alt="使用者選單"
            />
            <span class="user-nickname hidden lg:block">{{ userInfo.nickname }}</span>
            
            <transition name="fade">
              <div v-show="showEdit" class="user-info-list">
                 <div class="user-menu">
                    <div class="user-header">
                       <p class="user-name">{{ userInfo.nickname }}</p>
                       <p class="user-email">{{ userInfo.email }}</p>
                    </div>
                    <NuxtLink to="/articles/create" class="menu-item">
                      <Icon name="ri:pencil-line" class="menu-icon" />
                      新增優惠券
                    </NuxtLink>
                    <button @click="handleLogout" class="menu-item logout">
                      <Icon name="ri:logout-box-line" class="menu-icon" />
                      登出
                    </button>
                 </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import useStore from "~~/store";
import useReferralStore from '~~/store/referral';
import { useRoute } from 'vue-router'

const { data } = await useFetch('/api/whoami')
const userInfo = useState('userInfo')
const showEdit = ref(false)
const route = useRoute()
const { host } = useRequestURL()

const store = useStore();
const userData = computed(() => store.getUserData);
const referral = useReferralStore();
const navOpen = ref(false)

// Menu Items Configuration
const menuItems = ref([
  {
    title: '探索優惠',
    path: '/',
    isOpen: false,
    children: [
      { title: '優惠券列表', path: '/' },
      { title: '優惠券地圖', path: '/map' },
      { title: '提交優惠券', path: '/coupons/submit' },
      { title: '更新時間列表', path: '/launch-schedule' },
    ]
  },
  {
    title: '住宿服務',
    path: '/homestay-list',
    isOpen: false,
    children: [
      { title: '合法民宿推薦', path: '/homestay-list' },
      { title: '民宿註冊申請', path: '/homestay-register' },
      { title: '民宿業者登入', path: '/homestay-login' },
    ]
  },
  {
    title: '旅遊資訊',
    path: '/yilan-activities',
    isOpen: false,
    children: [
      { title: '宜蘭活動總匯', path: '/yilan-activities' },
      { title: '代訂服務', path: '/relative' },
    ]
  },
  {
    title: '關於平台',
    path: '/about',
    isOpen: false,
    children: [
      { title: '關於我們', path: '/about' },
      { title: '使用規範', path: '/rule' },
    ]
  }
])

const toggleMobileSubmenu = (index) => {
  menuItems.value[index].isOpen = !menuItems.value[index].isOpen
}

onMounted(() => {
  store.fetchAndSetUser()
  referral.setReferral(route.query)
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
/* Resurrected Original Styles & New SCSS for Dropdowns */
.index-nav {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 40;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 20px;
  
  @media (max-width: 768px) {
    display: none;
  }
}

.nav-item-group {
  position: relative;
  cursor: pointer;
  padding: 10px 0; /* Add trigger area */
  
  &:hover .nav-dropdown {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
  }

  /* Style for the main nav link triggers */
  .nav-link-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 15px;
    font-weight: 600;
    color: #333;
    transition: all 0.3s ease;
    
    &:hover {
      color: #764ba2;
      background-color: rgba(118, 75, 162, 0.1);
    }
    
    .nav-icon {
      font-size: 14px;
      transition: transform 0.3s;
    }
  }
  
  &:hover .nav-icon {
    transform: rotate(180deg);
  }
}

.nav-dropdown {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  min-width: 180px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 50;
  overflow: hidden;
  border: 1px solid #f0f0f0;
}

.dropdown-link {
  display: block;
  padding: 10px 16px;
  color: #555;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.2s;
  
  &:hover {
    background: #f9f9f9;
    color: #764ba2;
  }
}

.user-img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #eee;
}

.user-info-list {
  position: absolute;
  right: 0;
  top: 45px;
  width: 240px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  border: 1px solid #f0f0f0;
  z-index: 100;
}

.user-menu {
  padding: 8px 0;
}

.user-header {
  padding: 10px 16px;
  border-bottom: 1px solid #eee;
  margin-bottom: 5px;
  
  .user-name {
    font-weight: bold;
    color: #333;
    margin: 0;
  }
  .user-email {
    font-size: 12px;
    color: #888;
    margin: 0;
  }
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  color: #555;
  text-decoration: none;
  font-size: 14px;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  
  &:hover {
    background: #f5f5f5;
    color: #333;
  }
  
  &.logout {
    color: #e53935;
    border-top: 1px solid #f5f5f5;
    margin-top: 5px;
    
    &:hover {
      background: #ffebee;
    }
  }
}

.menu-icon {
  margin-right: 8px;
  font-size: 16px;
}

/* Mobile Side Menu */
#sidemenu {
  .sidemenu__btn {
    display: block;
    width: 40px;
    height: 40px;
    border: none;
    position: fixed;
    right: 7px; // Original was 7px
    top: 5px; // Add top since fixed
    // margin: 7px; // Remove margin if we use top/right
    background: transparent;
    z-index: 99;
    cursor: pointer;
    
    @media (min-width: 768px) {
      display: none;
    }

    span {
      display: block;
      width: 20px;
      height: 2px;
      margin: auto;
      background: black;
      position: absolute;
      top: 0; bottom: 0; left: 0; right: 0;
      transition: all .4s ease;

      &.top { transform: translateY(-8px); }
      &.mid { opacity: 1; } /* Restore mid */
      &.bottom { transform: translateY(8px); }
    }
    
    &.active {
      .top { transform: rotate(-45deg); }
      .mid { transform: translateX(-20px) rotate(360deg); opacity: 0; }
      .bottom { transform: rotate(45deg); }
    }
  }

  nav {
    width: 100%;
    height: 100%;
    background: #c9e0f6;
    position: fixed;
    top: 0;
    right: 0;
    z-index: 90;
    overflow-y: auto;
  }

  .sidemenu__wrapper {
    padding-top: 50px;
  }

  .sidemenu__list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .sidemenu__item {
    border-bottom: 1px solid rgba(255,255,255,0.3);
    
    .sidemenu__title {
      padding: 1.2em;
      font-size: 1.4em;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }
    
    a {
      text-decoration: none;
      line-height: 1.6em;
      font-size: 1.6em;
      padding: .5em;
      display: block;
      color: white;
      transition: .4s ease;

      &:hover {
        background: lightgrey;
        color: dimgrey;
      }
    }
    
    .sidemenu__link {
       padding: 1.2em; // Match title padding for non-expandable items
    }
  }
  
  .sidemenu__sublist {
    background: rgba(255, 255, 255, 0.4);
    list-style: none;
    padding: 0;
  }
  
  .sidemenu__subitem {
    a {
      font-size: 1.2em;
      padding-left: 2em;
      display: block;
      color: #4a5568; /* Dark gray for contrast against light background */
      text-decoration: none;
      padding: 0.8em 0.8em 0.8em 2em;
      font-weight: 500;
      
      &:hover {
         background: rgba(255, 255, 255, 0.6);
         color: #2d3748;
      }
    }
  }
}

/* Transitions */
.translateX-enter-active, .translateX-leave-active {
  transition: .3s ease;
}
.translateX-enter-from, .translateX-leave-to {
  transform: translateX(200px);
  opacity: 0;
}
.translateX-enter-to, .translateX-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s ease-out;
  max-height: 500px;
  overflow: hidden;
}
.slide-down-enter-from, .slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
