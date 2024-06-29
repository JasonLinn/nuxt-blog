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
let text = 'test'
const route = useRoute()
let id = route?.query?.id
const sendMSG = () => {
    alert(456)
    try {
        useFetch("/api/sendMsg", {
        "headers": {
            "Access-Control-Allow-Origin": "*",
            'Content-Type': 'application/json',
            'Authorization': 'Bearer +qlxI8MrmkzmLSRhMnyQ2Y4bBrFWpJGpvTliKBVR7mHGZV4Ffh2XbTXca72KWzXtHt5B9tXQEeQwH7eB9JbWde+lVyaOz1TPBRw43R+onRwFi4xEHYz+vk8ec7wgAY4GMC/gTcdhXcvY9paiY2nqZwdB04t89/1O/w1cDnyilFU='
        },
        "method": "POST",
        "body": {
            "to": "U6a5aaa9d07c1d3742e19ccbdbe3b9e4a",
            "messages":[
                {
                    "type":"text",
                    "text":"3345678"
                },
                {
                    "type":"text",
                    "text":"Hello, world2"
                }
            ]
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