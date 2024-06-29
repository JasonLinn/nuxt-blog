<template>
    <div class="container">
        <div class="row">
            <textarea name="" id="" cols="30" rows="10" :value="text"></textarea>
            <div class="btn btn-info" @click="sentNotify">送出</div>
        </div>
    </div>
</template>

<script setup>
    let text = 123;
    const sentNotify = () => {
        alert(123)
        useFetch('https://notify-api.line.me/api/notify', {
        'headers': {
            "Access-Control-Allow-Origin": "*",
            // "Content-Type": "multipart/form-data",
            // 'Sec-Fetch-Mode:': 'cors',
            'Authorization': 'Bearer ' + '2aj6Y6IY0aiMAPL6LmCOlqHpsOCh7ieT7yNZ3j849kS',
            "Access-Control-Allow-Methods": "*",
            'Access-Control-Allow-Headers': '*',
            // 'Accept': '*/*',
            // 'Sec-Fetch-Site': 'same-origin',
        },
        'method': 'post',
        'body': {
            'message': 123
        },
        'payload': {
        'message': 123,
        'stickerPackageId': '2',
        'stickerId': '523'
            }
        });
    }
</script>