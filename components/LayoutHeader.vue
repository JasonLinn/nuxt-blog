<template>
  <header class="flex w-full justify-center container">
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
            <li class="sidemenu__item" v-on:click="navOpen=!navOpen">
              <NuxtLink
                to="/"
              >
                <p class="">優惠券</p>
              </NuxtLink>
            </li>
            <li class="sidemenu__item" v-on:click="navOpen=!navOpen">
              <NuxtLink
                to="/map"
              >
                <p class="">優惠券(地圖搜尋)</p>
              </NuxtLink>
            </li>
            <li class="sidemenu__item" v-on:click="navOpen=!navOpen">
              <NuxtLink
                to="/relative"
              >
                <p class="">代訂服務</p>
              </NuxtLink>
            </li>
            <li class="sidemenu__item" v-on:click="navOpen=!navOpen">
              <NuxtLink
                to="/about"
              >
                <p class="">關於我們</p>
              </NuxtLink>
            </li>
            <li class="sidemenu__item" v-on:click="navOpen=!navOpen">
              <NuxtLink
                to="/rule"
              >
                <p class="">使用規範</p>
              </NuxtLink>
            </li>
            <li class="sidemenu__item" v-on:click="navOpen=!navOpen">
              <NuxtLink
                v-if="userData?.userId"
                class="get"
                to="/userInfo"
              >
                <p class="">查看已領</p>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </nav>
    </transition>
  </div>
    <nav class="index-nav flex w-full max-w-7xl items-center justify-between px-6 py-2">
      <div class="nav-wrapper">
        <NuxtLink
          :to="{
            name: 'index'
          }"
        >
        <img src="/logo.jpg" width="200" alt="宜蘭旅遊通">
          <!-- <div class="flex items-center justify-between">
            <h1 class="index-title">宜蘭旅遊通</h1>
          </div> -->
        </NuxtLink>
        <!-- <div class="user-status">{{displayName ? `Hi, ${displayName}` : '未登入'}}</div> -->
      </div>
      <div class="user-info group relative p-2" v-show="userData" v-on:click="navOpen=!navOpen">
        <img class="user-img" :src="userData?.pictureUrl" :alt="userData?.displayName">
      </div>
        <div v-if="userInfo" class="user-info group relative">
          <div for="avatar" class="avatar cursor-pointer py-2" v-on:mouseenter="toggleEdit" v-on:mouseleave="toggleEdit" :on-focus="toggleEdit">
            <img
              class="user-img inline-block h-10 w-10 rounded-full bg-white/90 object-cover object-center p-0.5 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
              :src="userInfo.avatar"
              alt="使用者選單"
            />
            <div v-show="showEdit" class="user-info-list absolute right-0 hidden w-60 pt-1 text-gray-700 group-hover:block">
              <div
                class="mt-1 px-4 py-3 divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <div class="flex items-center">
                  <img
                    :src="userInfo.avatar"
                    class="user-img inline-block h-9 w-9 rounded-full bg-white/90 object-cover object-center p-0.5 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur"
                  />
                  <div class="ml-3.5 flex-grow overflow-hidden">
                    <p class="overflow-hidden text-ellipsis font-medium">{{ userInfo.nickname }}</p>
                    <p class="overflow-hidden text-ellipsis text-xs text-gray-500">
                      {{ userInfo.email }}
                    </p>
                  </div>
                </div>
                <div class="group/menu-item py-2">
                  <NuxtLink
                    class=""
                    to="/articles/create"
                  >
                    <Icon
                      class="mr-2 h-5 w-5"
                      name="ri:pencil-line"
                    />
                    新增優惠券
                  </NuxtLink>
                </div>
                <div class="py-1">
                  <button
                    class="logout-btn btn btn-info text-white"
                    @click="handleLogout"
                  >
                    <Icon
                      class="mr-2 h-5 w-5"
                      name="ri:logout-box-line"
                    />
                    登出
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 管理員登入入口 -->
        <!-- <NuxtLink
          v-else
          class="login px-3 py-2"
          to="/login"
        >
          登入
        </NuxtLink> -->
        <img :src="imgUrl" />
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import useStore from "~~/store";
import useReferralStore from '~~/store/referral';

const { data } = await useFetch('/api/whoami')
const userInfo = useState('userInfo')
const showEdit = ref(false)
const imgUrl = ref('')
const route = useRoute()

const store = useStore();
const userData = computed(() => store.getUserData);
const referral = useReferralStore();
const navOpen = ref(false)
onMounted(() => {
  store.fetchAndSetUser()
  referral.setReferral(route.query)
})
// onMounted(async () => {
//     try {
//       await liff.init({ liffId: "2005661804-zld9QenV" }); // Use own liffId
//       await liff.getProfile().then(profile => {
//         if (!liff.isLoggedIn()) {
//           return;
//         }
//         insertUser(profile)
//         // 拿取profile
//         // document.getElementById('userId').innerHTML = profile.userId
//         displayName.value = profile.displayName
//         imgUrl = profile.pictureUrl
//         // document.getElementById('statusMessage').innerHTML = profile.statusMessage
//       })
//   }  catch (err) {
//       console.log(`liff.state init error ${err}`);
//   }
// })

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

const toggleEdit = () => {
  showEdit.value = !showEdit.value;
}
</script>

<style lang="scss" scoped>
.login {
  display: block;
  position: absolute;
  right: 0;
  top: 0;
}
.get {
  font-size: 12px;
}
.user-info {
  position: fixed;
  right: 35px;
  top: 5px;
  width: auto;
  z-index: 2;
}
.user-img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  overflow: hidden;
}
.index-nav {
  width: 100%;
  display: inline-grid;
}
.nav-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.index-title {
  text-decoration: none;
  color: #000;
  font-size: 25px;
  font-weight: bold;
}

.user-info-list {
  position: absolute;
  right: 0;
  top: 40px;
}
.logout-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 70px;
  height: 30px;
  font-size: 14px;
  padding: 0;
}
.user-status {
  font-size: 12px;

}

#sidemenu {
	nav {
		width: 100%;
    height: 100%;
		// height: calc(100% - #{$headerHeight} - #{$footerHeight});
		background: #c9e0f6;
		position: fixed;
		top: 0;
		right: 0;
    z-index: 2;
		// box-shadow: 2px 0 3px$grey-6;
		// overflow-y: scroll;
	}
  .sidemenu__btn {
    background-color: #f4606000;
  }
  .sidemenu__item {
      height: 60px;
    }
	.sidemenu {
		&__btn {
			display: block;
			width: 40px;
			height: 40px;
			// background: grey;
			border: none;
			position: fixed;
      right: 0;
      margin: 7px;
			z-index: 100;
			appearance: none;
			cursor: pointer;
			outline: none;
      z-index: 3;
			span {
				display: block;
				width: 20px;
				height: 2px;
				margin: auto;
				background: black;
				position: absolute;
				top: 0;
				bottom: 0;
				left: 0;
				right: 0;
				transition: all .4s ease;

				&.top {
					transform: translateY(-8px);
				}

				&.bottom {
					transform: translateY(8px);
				}
			}
			&.active{
				.top {
					transform: rotate(-45deg);
				}
				.mid{
					transform: translateX(-20px) rotate(360deg);
					opacity: 0;
				}
				.bottom {
					transform: rotate(45deg);
				}
			}

		}

		&__wrapper {
      padding-top: 50px;
    }

		&__list {
			padding-top: 50px;
      list-style:none;
      padding: 0;
      margin: 0;
		}

		&__item {
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
		}
	}
}

.translateX-enter{
	transform:translateX(200px);
	opacity: 0;
  transition: .3s ease;
}

.translateX-enter-active,.translateX-leave-active{
	transform-origin: top right 0;
	transition:.3s ease;
}

.translateX-leave-to{
	transform: translateX(200px);
	opacity: 0;
}
.avatar {
  padding-right: 10px;
}
</style>
