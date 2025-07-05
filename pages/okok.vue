<template>
	<input type="file" @input="handleFileInput" multiple />
	<button @click="submit">submit</button>
	<a href="https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=2005661804&redirect_uri=https://bff1faf23607.ngrok.app/line_callback&state=openid%20email%20profile&bot_prompt=normal&scope=openid%20email%20profile">
		<img src="/icon/line_login.png" alt="line-login">
	</a>

</template>

<script setup>
const { handleFileInput, files } = useFileStorage()

const submit = async () => {
	const response = await $fetch('/api/files', {
		method: 'POST',
		body: {
			files: files.value
		}
	})
    console.log(response,'rrrrr')
}
</script>