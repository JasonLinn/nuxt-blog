export default defineEventHandler(async (event) => {
    useFetch('https://api.line.me/v2/bot/message/push', {
        // "headers": {
        //     "Access-Control-Allow-Origin": "*",
        //     'Content-Type': 'application/json',
        //     'Authorization': 'Bearer +qlxI8MrmkzmLSRhMnyQ2Y4bBrFWpJGpvTliKBVR7mHGZV4Ffh2XbTXca72KWzXtHt5B9tXQEeQwH7eB9JbWde+lVyaOz1TPBRw43R+onRwFi4xEHYz+vk8ec7wgAY4GMC/gTcdhXcvY9paiY2nqZwdB04t89/1O/w1cDnyilFU='
        // },
    });
})
