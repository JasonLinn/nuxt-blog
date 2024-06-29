import axios from "axios"

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    console.log(event, 'eeeeeeeee', body)
    await axios({
        "url": 'https://api.line.me/v2/bot/message/push',
        "headers": {
            'Content-Type': 'application/json',
            "Authorization": 'Bearer +qlxI8MrmkzmLSRhMnyQ2Y4bBrFWpJGpvTliKBVR7mHGZV4Ffh2XbTXca72KWzXtHt5B9tXQEeQwH7eB9JbWde+lVyaOz1TPBRw43R+onRwFi4xEHYz+vk8ec7wgAY4GMC/gTcdhXcvY9paiY2nqZwdB04t89/1O/w1cDnyilFU=',
        },
        "method": 'POST',
        "data": {
            "to": body.id,
            "messages":[
                {
                    "type":"text",
                    "text": body.text
                }
            ]
        }
    }).then(res =>{
        console.log(res, 'rrrr')
    }).catch((error) => console.log(error, 'rrreeeeee'))
})
