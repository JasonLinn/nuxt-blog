<template>
    <div class="container">
        <p>回覆資訊:</p>
        <textarea name="" id="" cols="30" rows="10" v-model="text"></textarea>
        <div class="btn btn-info" @click="sendMSG">
            送出
        </div>
    </div>




</template>

<script setup>
let text = '推薦您好客民宿\n'+'編號: 001'
const route = useRoute()
let id = route?.query?.id
const sendMSG = async () => {
    console.log(id, 'iiiii')
    try {
        await useFetch("/api/sendMsg", {
        "method": "POST",
        "body": {
            "id": id,
            "text": text,
        },
        // "to": id,
        // "messages": [
        //     {
        //         "type":"text",
        //         "text": '44564646'
        //     },
        //     {
        //         "type":"text",
        //         "text":"Hello, world2"
        //     }
        // ],
        // "query": {
        //     "to": id,
        //     "messages": [
        //         {
        //         "type": "text",
        //         "text": "Hello, world"
        //         }
        //     ]
        //     }
    })
    } catch (error) {
        alert(error)
    }
}
</script>