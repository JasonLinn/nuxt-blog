import axios from "axios"

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    console.log(event, body, 'eeeeee')
    axios.post('https://notify-api.line.me/api/notify', {
        "headers": {
            "Authorization": 'Bearer ' + process.env.CHANNEL_ACCESS_TOKEN,
        },
        "method": 'POST',
        "body": {
            "message": 123
        }

    })
    // useFetch('https://notify-api.line.me/api/notify', {});
})
