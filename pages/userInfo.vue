<template>
    <div class="container">
        <div class="row">
            <!-- <div id="userId">{{coupons}}</div> -->
            <!-- <textarea name="" id="" cols="30" rows="10" v-model="text"></textarea> -->
            <h2 class="cupon-geted">已領優惠券</h2>
            <hr>
            <div v-if="coupons">
                <div v-if="!coupons?.length">尚未領取優惠券</div>
                <article
                    v-for="coupon in coupons"
                    :key="JSON.parse(coupon).id"
                    class="cupon col-md-3"
                    >
                    <NuxtLink
                        class=""
                        :to="{
                          name: 'articles-id',
                          params: {
                              id: JSON.parse(coupon).id
                        }}"
                    >
                        <div class="cupon-img-wrapper">
                        <img :src="JSON.parse(coupon).cover" class="cupon-img"/>
                        </div>
                        <div class="cupon-info">
                        <h2 class="cupon-title">
                            <span class="">{{ JSON.parse(coupon).title }}</span>
                        </h2>
                        <span class="cupon-category">
                            <!-- {{ hadleCategory(JSON.parse(coupon).category) }} -->
                        </span>
                        <!-- <time class="order-first mb-3 flex items-center text-sm text-gray-400 md:hidden">
                            {{ date2LocaleString(JSON.parse(coupon).updated_at) }}
                        </time> -->
                        <p class="index-cupon-text">
                            {{ JSON.parse(coupon).content.replace(/\n/g, ' ').substring(0, 300) }}
                        </p>
                        </div>
                        <!-- <span
                        aria-hidden="true"
                        class="mt-4 flex items-center text-sm font-medium text-emerald-500"
                        >
                        看更多
                        <Icon name="ri:arrow-right-s-line" />
                        </span> -->
                    </NuxtLink>
                    <!-- <time class="order-first mb-3 mt-1 hidden items-center text-sm text-gray-400 md:flex">
                        {{ date2LocaleString(article.updated_at) }}
                    </time> -->
                    </article>
            </div>
        </div>
    </div>
</template>

<script setup>
import useStore from "~~/store";
const store = useStore();
const userName = computed(() => store.getUserDisplayName);
const userId = store.getUserId
const coupons = computed(() => store.getUserCoupons)
// const userI = store.getUserInfo
// const data =''
// onMounted(() => {
//   const { pending, data: user, error } = useFetch(`/api/user/${userId}`)
// })
console.log(coupons, 'kkkkkkqqqq', userId)

const items = [
  "{\"id\":35,\"title\":\"農場\",\"category\":\"buy\",\"content\":\"GOOD\",\"cover\":\"https://cc.tvbs.com.tw/img/program/upload/2021/12/29/20211229112130-d5a65e50.jpg\",\"amount\":9952,\"used_times\":0,\"hash\":[\"\"],\"updated_at\":\"2024-07-24T06:05:16.617Z\"}",
  "{\"id\":35,\"title\":\"農場\",\"category\":\"buy\",\"content\":\"GOOD\",\"cover\":\"https://cc.tvbs.com.tw/img/program/upload/2021/12/29/20211229112130-d5a65e50.jpg\",\"amount\":9951,\"used_times\":0,\"hash\":[\"\"],\"updated_at\":\"2024-07-24T06:21:04.378Z\"}"
]
const fakeUser = {
  id: 11,
  name: 'Jason Lin',
  user_id: 'U6a5aaa9d07c1d3742e19ccbdbe3b9e4a',
  cover: 'https://profile.line-scdn.net/0hsDb-1A3zLGtPVDyaTipSFD8ELwFsJXV5ZWBlWioGdAknZmxuYjdjXn9dJQh1ZW85ZjE2DXxXJVlDR1sNUQLQX0hkcVpzYGw6YztiiA',
  coupons: [
    '{"id":35,"title":"農場","category":"buy","content":"GOOD","cover":"https://cc.tvbs.com.tw/img/program/upload/2021/12/29/20211229112130-d5a65e50.jpg","amount":9952,"used_times":0,"hash":[""],"updated_at":"2024-07-24T06:05:16.617Z"}',
    '{"id":35,"title":"農場","category":"buy","content":"GOOD","cover":"https://cc.tvbs.com.tw/img/program/upload/2021/12/29/20211229112130-d5a65e50.jpg","amount":9951,"used_times":0,"hash":[""],"updated_at":"2024-07-24T06:21:04.378Z"}',
    '{"id":35,"title":"農場","category":"buy","content":"GOOD","cover":"https://cc.tvbs.com.tw/img/program/upload/2021/12/29/20211229112130-d5a65e50.jpg","amount":9950,"used_times":0,"hash":[""],"updated_at":"2024-07-24T06:28:24.715Z"}',
    '{"id":34,"title":"好玩","category":"play","content":"好玩a1","cover":"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDF4NhElQATrC2VFZyaEUenGHyU0voLS-s8A&s","amount":1999993,"used_times":0,"hash":["a1","a2"],"updated_at":"2024-07-13T04:27:39.043Z"}',
  ],
  msg_times: 0,
  join_at: "2024-07-24T06:19:34.744Z"
}
// user.map((item)=> {
//     console.log(JSON.parse(item).title, 'kkkkkk')
// })
</script>

<style lang="scss" scoped>
.cupon-geted {
  font-weight: bold;
  margin-bottom: 20px;
  margin-top: 10px;
}
.cupon-wrapper {
  // border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
}
.cupon-wrapper:hover {
  box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
}
.cupon-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 5px;
}
.cupon-info {
  padding: 5px 8px 15px 8px;
  background-color: #fff;
}
.cupon-info:hover {
  box-shadow: #000;
}
.cupon-img-wrapper {
  height: 200px;
  overflow: hidden;
}
.cupon-img {
  display: inline-block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}
.cupon-category {
  display: inline-block;
  font-size: 14px;
  padding: 3px;
  color: rgb(117, 117, 117);
  background-color: rgb(245, 245, 245);
  margin-bottom: 10px;
}
</style>