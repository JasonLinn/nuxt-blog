import * as line from '@line/bot-sdk'
import linebot from 'linebot'

// create LINE SDK config from env variables
const config = {
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  let eventMsg = event.message.text;
  let text = eventMsg;
  if (eventMsg == '你好') {
    text = '不好'
  }
  // create an echoing text message
  const echo = { type: 'text', text };

  // use reply API
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [echo],
  });
}

export default defineEventHandler(async (event) => {
    try {
      const body = await readBody(event)
      Promise
      .all(body.events.map(handleEvent))
      .then((result) => {
        console.log(result)
      })
      .catch((err) => {
        console.error(err);
        // res.status(500).end();
      });
      } catch (e) {
        console.log(e, 'EEEEEEEEERRRR')
        // throw createError({
        //   statusCode: 401,
        //   statusMessage: 'Unauthorized'
        // })
      }
})
