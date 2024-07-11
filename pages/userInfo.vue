<template>
    <div class="container">
        <div class="row">
            <div id="userId">{{userName}}</div>
            <!-- <textarea name="" id="" cols="30" rows="10" v-model="text"></textarea> -->
            <div class="btn btn-info" @click="sentNotify">送出</div>
        </div>
    </div>
</template>

<script setup>
import useStore from "~~/store";
const store = useStore();
const userName = computed(() => store.getUserName);
</script>