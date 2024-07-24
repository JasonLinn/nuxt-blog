<template>
    <div class="container">
        <div class="row">
            <div id="userId">{{userName}}</div>
            <!-- <textarea name="" id="" cols="30" rows="10" v-model="text"></textarea> -->
            <div class="btn btn-info" @click="sentNotify">送出</div>
            <div v-for="coupon in coupons">
                {{ JSON.parse(coupon).id }}
            </div>
            {{userId}}
        </div>
    </div>
</template>

<script setup>
import useStore from "~~/store";
const store = useStore();
const userName = computed(() => store.getUserName);
const userId = computed(() => store.getUserId)
const { pending, data: coupons, error } = await useFetch(`/api/user/${userId}`)
const items = [
  "{\"id\":35,\"title\":\"農場\",\"category\":\"buy\",\"content\":\"GOOD\",\"cover\":\"https://cc.tvbs.com.tw/img/program/upload/2021/12/29/20211229112130-d5a65e50.jpg\",\"amount\":9952,\"used_times\":0,\"hash\":[\"\"],\"updated_at\":\"2024-07-24T06:05:16.617Z\"}",
  "{\"id\":35,\"title\":\"農場\",\"category\":\"buy\",\"content\":\"GOOD\",\"cover\":\"https://cc.tvbs.com.tw/img/program/upload/2021/12/29/20211229112130-d5a65e50.jpg\",\"amount\":9951,\"used_times\":0,\"hash\":[\"\"],\"updated_at\":\"2024-07-24T06:21:04.378Z\"}"
]
items.map((item)=> {
    console.log(JSON.parse(item).title, 'eeeeeeeeeeee')
})
</script>