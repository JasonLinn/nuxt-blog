import * as line from '@line/bot-sdk'
import { pool } from '@/server/utils/db'

// create LINE SDK client
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

async function handleEvent (event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  let eventMsg = event.message.text;
  let flex = {
    type: "flex",
    altText: "優惠券列表",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: eventMsg
          }
        ]
      }
    }
  }
  if (eventMsg == '你好') {
    flex.contents.body.contents = [{
      type: 'text',
      text: '很高興為您服務'
    }]
  }
  if(eventMsg == '優惠券' || '優惠券列表') {
    let cupon = await getCupon()
    flex.contents.body.contents = cupon.map((item, index)=> {
      return {
        type: 'text',
        text: index+1 + '.' + item.title
      }
    })
  }

  // use reply API
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [flex],
  });
}

export default defineEventHandler(async (event) => {
    try {
      const body = await readBody(event)
      await Promise
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

const getCupon = async () => {
  const cuponRecords = await pool
    .query(`SELECT * FROM "article"`)
    .then((result) => result.rows)
    .catch((error) => {
      console.error(error)
      throw createError({
        statusCode: 500,
        message: '無法取得優惠券列表，請稍候再試'
      })
    })
  return cuponRecords
}
