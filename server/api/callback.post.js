import axios from "axios"

//點了驗證連結後進來https://notify-bot.line.me/oauth/authorize?response_type=code&scope=notify&response_mode=form_post&client_id=8jilqbG1VMeizXW9U36bH1&redirect_uri=https://nuxt-blog-swart.vercel.app/api/callback/&state=f094a459-1d16-42d6-a709-c2b61ec53d60
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    console.log('New request: ' + getRequestURL(event), 'nnnnnnnnnnnnnnnnnnnnn')
    console.log(event, body, 'bbbbbbcccc')
    await axios.post(`https://notify-bot.line.me/oauth/token?grant_type=authorization_code&code=${body.code}&redirect_uri=https://nuxt-blog-swart.vercel.app/api/callback/&client_id=8jilqbG1VMeizXW9U36bH1&client_secret=a3G7L0gzZJ6vR9ALXRvLu21yMcqPZYb2cnTJbx9IhTn`, {
        // "headers": {
        //     // "grant_type": "authorization_code",
        //     // "code": body.code,
        //     // "redirect_uri": "https://446a-49-158-194-181.ngrok-free.app/api/callback",
        //     // "client_id": "8jilqbG1VMeizXW9U36bH1",
        //     // "client_secret": "a3G7L0gzZJ6vR9ALXRvLu21yMcqPZYb2cnTJbx9IhTn",
        //     "Content-Type":	"application/x-www-form-urlencoded",
        // },
        // "method": "POST",
        // query: {
        //     "grant_type": "authorization_code",
        //     "code": body.code,
        //     "redirect_uri": "https://446a-49-158-194-181.ngrok-free.app/",
        //     "client_id": "8jilqbG1VMeizXW9U36bH1",
        //     "client_secret": "a3G7L0gzZJ6vR9ALXRvLu21yMcqPZYb2cnTJbx9IhTn",
        // }
    }).then(async (res)=>{
        await sendRedirect(event, '/notify?token='+ res.data.access_token)
        console.log(res.data,res.data.access_token, "aaaaa")
        // await axios.post('https://httpbin.org/post', {
        //     firstName: 'Fred',
        //     lastName: 'Flintstone',
        //     orders: [1, 2, 3],
        //     photo: document.querySelector('#fileInput').files
        //   }, {
        //     headers: {
        //       'Content-Type': 'multipart/form-data'
        //     }
        //   }
        // )
        axios.post('https://notify-api.line.me/api/notify', {
            'message':  'ok',
        },{
            headers: {
                "Authorization": 'Bearer ' + res.data.access_token,
                "Content-Type": 'application/x-www-form-urlencoded',
            },
        }).then(res =>{
            console.log(res, 'qqqq')
        }).catch((error) => console.log(error, 'rrreeeeeeqqqq'))
        // axios.post('https://notify-api.line.me/api/notify?&message=hihihihi',{
        //     "headers": {
        //         "Content-Type": 'application/x-www-form-urlencoded',
        //         "Authorization": 'Bearer ' + res.data.access_token,
        //     },
        //     "method": 'POST',
        //     // "message": "hi",
        //     // "data":{
        //     //     "message": "hi",
        //     // },
        //     // "query": {
        //     //     "message": "hi",
        //     //     // "to": body.id,
        //     //     // "messages":[
        //     //     //     {
        //     //     //         "type":"text",
        //     //     //         "text": '你好'
        //     //     //     }
        //     //     // ]
        //     // }
        // }).then(res =>{
        //     console.log(res, 'qqqq')
        // }).catch((error) => console.log(error, 'rrreeeeeeqqqq'))
    })

    // if (body.access_token) {
    //     return {
    //         text: "token!!"
    //     }
    // }
    // useFetch('https://notify-api.line.me/api/notify', {});
})
