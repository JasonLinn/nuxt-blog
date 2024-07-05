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
let token = route?.query?.token
const sendMSG = async () => {
    console.log(id, 'iiiii')

    // 由Notify發送訊息
    if (token) {
        await useFetch("/api/notify", {
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/x-www-form-urlencoded",
                // 'Sec-Fetch-Mode:': 'cors',
                'Authorization': 'Bearer '+ token,
                "Access-Control-Allow-Methods": "*",
                'Access-Control-Allow-Headers': '*',
                // 'Accept': '*/*',
                // 'Sec-Fetch-Site': 'same-origin',
            },
            "method": "POST",
            "body": {
                "token": token,
                "text": text,
            },
        })
    }

    // 由官方LINE push message
    if (id) {
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
    }
}
</script>