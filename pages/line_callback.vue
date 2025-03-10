<template>
    <div class="container">
        <h1 class="loading-title">
            LINE登入中 ···
        </h1>
        <CustomerLoading :isLoading="true"/>
    </div>
	<!-- <a href="https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=2005661804&redirect_uri=https://bff1faf23607.ngrok.app/line_callback&state=openid%20email%20profile&bot_prompt=normal&scope=openid%20email%20profile">
		<img src="/icon/line_login.png" alt="line-login">
	</a> -->
</template>

<script setup>
import axios from 'axios'
import Qs from 'qs'
import {jwtDecode} from 'jwt-decode'
import useStore from '~/store';
const route = useRoute()
let code = route?.query?.code
const state = route?.query?.state
const store = useStore()

onMounted(()=>{
    if (code) {
        // 確保在客戶端執行
        if (process.client && typeof window !== 'undefined') {
            // 獲取當前的 URL 協議和主機名
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const port = window.location.port ? `:${window.location.port}` : '';
            const baseUrl = `${protocol}//${hostname}${port}`;
            
            // 構建完整的回調 URL
            const redirectUri = `${baseUrl}/line_callback`;
            
            let options = Qs.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                client_id: '2005661804',
                client_secret: 'ea9ea801badf2520f070b20f6453271d' // 注意：最好使用環境變量
            });
            
            console.log('Redirect URI:', redirectUri); // 調試用
            
            axios.post('https://api.line.me/oauth2/v2.1/token', options, { 
                headers: { 'Content-Type': 'application/x-www-form-urlencoded'}
            }).then(async(res) => {
                // this.tokenResult = res.data // 回傳的結果
                // this.idTokenDecode = jwtDecode(res.data.id_token) // 把結果的id_token做解析
                await store.fetchAndSetUser(jwtDecode(res.data.id_token))
                console.log(store.getUserData, 'uuuuuukkkkk')
                if (state) {
                    await navigateTo(state)
                }
            }).catch(error => {
                console.error('LINE 登錄錯誤:', error);
                console.error('錯誤詳情:', error.response?.data);
                // 可以添加錯誤處理邏輯，例如顯示錯誤消息或重定向到登錄頁面
            });
        }
    }
})
</script>
<style>
.loading-title {
    display: inline-block;
    font-size: 26px;
    font-weight: bold;
}
</style>