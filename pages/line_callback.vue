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
        let options = Qs.stringify({ // POST的參數  用Qs是要轉成form-urlencoded 因為LINE不吃JSON格式
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: `https://${window.location.hostname}/line_callback`,
                client_id: '2005661804',
                client_secret: 'ea9ea801badf2520f070b20f6453271d'
            })
        
            axios.post('https://api.line.me/oauth2/v2.1/token', options, { headers: { 'Content-Type': 'application/x-www-form-urlencoded'}}).then(async(res) => {
            // this.tokenResult = res.data // 回傳的結果
            // this.idTokenDecode = jwtDecode(res.data.id_token) // 把結果的id_token做解析
            await store.fetchAndSetUser(jwtDecode(res.data.id_token))
            console.log(store.getUserData, 'uuuuuukkkkk')
            if (state) {
                await navigateTo(state)
            }
        })
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