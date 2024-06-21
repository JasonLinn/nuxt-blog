import line from ('@line/bot-sdk')

// create LINE SDK config from env variables
const config = {
    channelSecret: process.env.CHANNEL_SECRET,
};
// create LINE SDK client
const client = new line.messagingApi.MessagingApiClient({
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
  });

export default defineEventHandler(async (event) => {
    await line.middleware(config)
    try {
        const body = await readBody(event)
        // create an echoing text message
        const echo = { type: 'text', text: body.message.text };

        // use reply API
        return client.replyMessage({
            replyToken: event.replyToken,
            messages: [echo],
        });
      } catch (e) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized'
        })
      }
})
