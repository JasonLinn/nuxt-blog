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
    import { ref } from 'vue'
    import liff from "@line/liff";

    onMounted(async () => {
    try {
      await liff.init({ liffId: "2005661804-pZRYaLm6" }); // Use own liffId
      await liff.getProfile().then(profile => {
        if (!liff.isLoggedIn()) {
          return;
        }
        // 拿取profile
        document.getElementById('userId').innerHTML = profile.userId
        // displayName.value = profile.displayName
        imgUrl = profile.pictureUrl
        // document.getElementById('statusMessage').innerHTML = profile.statusMessage
            })
        }  catch (err) {
            console.log(`liff.state init error ${err}`);
        }
        })

    const text = ref('')
    const sentNotify = () => {
        alert(123)
        useFetch('/api/notify', {
            "headers": {
                "Access-Control-Allow-Origin": "no-cors",
                "Content-Type": "application/x-www-form-urlencoded",
                // 'Sec-Fetch-Mode:': 'cors',
                'Authorization': 'Bearer '+ '2aj6Y6IY0aiMAPL6LmCOlqHpsOCh7ieT7yNZ3j849kS',
                // "Access-Control-Allow-Methods": "*",
                // 'Access-Control-Allow-Headers': '*',
                // 'Accept': '*/*',
                // 'Sec-Fetch-Site': 'same-origin',
            },
            "method": 'POST',
            "message": '你好阿',
            "body": {
                "message": '你好阿22212313'
            },
            "query": {
                'message': text,
                'stickerPackageId': '2',
                'stickerId': '523'
            }
        });
    }
</script>