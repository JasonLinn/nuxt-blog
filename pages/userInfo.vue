<template>
    <div class="container">
        <div class="row">
            <div id="userId">aaaa</div>
            <textarea name="" id="" cols="30" rows="10" v-model="text"></textarea>
            <div class="btn btn-info" @click="sentNotify">送出</div>
        </div>
    </div>
</template>

<script setup>
const { pending, data: user, error } = await useFetch(`/api/user/${route.params.id}`)

if (error.value) {
  console.log(error.value)
  throw createError({ statusCode: 404 })
}
</script>