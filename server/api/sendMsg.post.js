import axios from "axios"

export default defineEventHandler((event) => {
    console.log(12333333)
    axios.post('https://api.line.me/v2/bot/message/push', {
        "headers": {
            "Authorization": 'Bearer +qlxI8MrmkzmLSRhMnyQ2Y4bBrFWpJGpvTliKBVR7mHGZV4Ffh2XbTXca72KWzXtHt5B9tXQEeQwH7eB9JbWde+lVyaOz1TPBRw43R+onRwFi4xEHYz+vk8ec7wgAY4GMC/gTcdhXcvY9paiY2nqZwdB04t89/1O/w1cDnyilFU=',
        },
        "method": 'POST',
        "body": {
            "to": "U6a5aaa9d07c1d3742e19ccbdbe3b9e4a",
            "messages":[
                {
                    "type":"text",
                    "text":"3345678"
                },
                {
                    "type":"text",
                    "text":"Hello, world2"
                }
            ]
        }

    })
    // useFetch('https://api.line.me/v2/bot/message/push', {
        // "headers": {
        //     "Access-Control-Allow-Origin": "*",
        //     'Content-Type': 'application/json',
        //     'Authorization': 'Bearer +qlxI8MrmkzmLSRhMnyQ2Y4bBrFWpJGpvTliKBVR7mHGZV4Ffh2XbTXca72KWzXtHt5B9tXQEeQwH7eB9JbWde+lVyaOz1TPBRw43R+onRwFi4xEHYz+vk8ec7wgAY4GMC/gTcdhXcvY9paiY2nqZwdB04t89/1O/w1cDnyilFU='
        // },
    // });
})
