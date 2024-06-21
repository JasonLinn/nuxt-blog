import linebot from 'linebot'

// create LINE SDK config from env variables
const config = {
    channelSecret: process.env.CHANNEL_SECRET,
};
// create LINE SDK client
const bot = linebot({
    channelId: process.env.CHANNEL_ID,
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
});

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        console.log(event,'tttt', body)

        // use reply API
        bot.on('message', async event => {
            let msg = {
                "type": "flex",
                "altText": "this is a flex message",
                "contents": {
                  "type": "bubble",
                  "body": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                      {
                        "type": "text",
                        "text": "hello"
                      },
                      {
                        "type": "text",
                        "text": "world"
                      }
                    ]
                  }
                }
              }
            event.reply(msg)
          })
      } catch (e) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized'
        })
      }
})
