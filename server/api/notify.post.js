import axios from "axios"

export default defineEventHandler(async (event) => {
    console.log(event, 'eeeee', axios,'aaaaa')
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
