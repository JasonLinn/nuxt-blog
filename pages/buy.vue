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
    let id = '5555555';
    let text = ''
    onMounted(async () => {
    try {
      await liff.init({ liffId: "2005661804-pZRYaLm6" }); // Use own liffId
      await liff.getProfile().then(profile => {
        if (!liff.isLoggedIn()) {
          return;
        }
        // 拿取profile
        document.getElementById('userId').innerHTML = profile.userId
        id = profile.userId;
        // displayName.value = profile.displayName
        imgUrl = profile.pictureUrl
        // document.getElementById('statusMessage').innerHTML = profile.statusMessage
            })
        }  catch (err) {
            console.log(`liff.state init error ${err}`);
        }
        })

    const sentNotify = () => {
        alert(123)
        useFetch('https://notify-api.line.me/api/notify/', {
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/x-www-form-urlencoded",
                // 'Sec-Fetch-Mode:': 'cors',
                'Authorization': 'Bearer '+ '2aj6Y6IY0aiMAPL6LmCOlqHpsOCh7ieT7yNZ3j849kS',
                "Access-Control-Allow-Methods": "*",
                'Access-Control-Allow-Headers': '*',
                // 'Accept': '*/*',
                // 'Sec-Fetch-Site': 'same-origin',
            },
            "method": 'POST',
            "message": '你好阿',
            "body": {
                "message": '你好阿22212313' + 'U6a5aaa9d07c1d3742e19ccbdbe3b9e4a',
                "imageThumbnail": "https//" + 'U6a5aaa9d07c1d3742e19ccbdbe3b9e4a'
            },
            "query": {
                'message':  text + JSON.stringify('https://7bc7-49-158-194-181.ngrok-free.app/user?id=' + 'U6a5aaa9d07c1d3742e19ccbdbe3b9e4a'),
                // "imageThumbnail": "https//" + id,
                'stickerPackageId': '2',
                'stickerId': '523'
            }
        });
    }
</script>