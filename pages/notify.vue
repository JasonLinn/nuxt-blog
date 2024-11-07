<template>
    <div class="container">
        <div class="row">
            <div class="info">
                恭喜連結成功!請輸入需求，符合條件的合法旅宿將會傳介紹給您
            </div>
            <textarea name="" id="" cols="30" rows="10" v-model="text"></textarea>
            <div class="btn btn-info" @click="sentNotify">送出</div>
        </div>
    </div>
</template>

<script setup>
    const route = useRoute()
    let token = route?.query?.token
    let text =
            '民宿: 衿日林\n' +
            'LINE:abc123\n' +
            // '電話：\n' +
            // 'ＬＩＮＥ：\n' +
            '預計入住日期：7/1\n' +
            '預計入住人數：16\n' +
            '預計需求房數：3+1\n' +
            '希望民宿設備：麻將\n' +
            '住宿預算：50000'
    console.log(token,'ttttttttt')
    const sentNotify = () => {
        alert(123)
        useFetch('/api/notify', {
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/x-www-form-urlencoded",
                // 'Sec-Fetch-Mode:': 'cors',
                // 這邊的Token是到特定群組
                'Authorization': 'Bearer '+ "2aj6Y6IY0aiMAPL6LmCOlqHpsOCh7ieT7yNZ3j849kS",
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
                'message':  '\n【民宿介紹】\n' + text + "\n\n點連結以回覆訂單: " + JSON.stringify('https://yilanpass.com/notify?token=' + token),
                // "imageThumbnail": "https//" + id,
                'stickerId': '52002736',
                'stickerPackageId': '11537',
            }
        });
    }
</script>