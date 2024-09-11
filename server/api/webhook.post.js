import * as line from '@line/bot-sdk'
import { pool } from '@/server/utils/db'

const liffUrl = "https://liff.line.me/2005661804-zld9QenV/";
// create LINE SDK client
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

async function handleEvent (event) {
  const noMsg = Promise.resolve(null)
  // 需要是訊息
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return noMsg;
  }

  let eventMsg = event.message.text;
  //echo message
  let flexMsg = {
    type: "flex",
    altText: "宜蘭旅遊通-優惠券",
    contents: null
    // {
    //   type: "bubble",
    //   body: {
    //     type: "box",
    //     layout: "vertical",
    //     contents: [
    //       // {
    //       //   type: "text",
    //       //   text: eventMsg
    //       // }
    //     ]
    //   }
    // }
  }
  // 旋轉木馬
  let carousel = {
    type: "carousel",
    contents: [
      {
        type: "bubble",
        size: "micro",
        hero: {
          type: "image",
          url: "https://developers-resource.landpress.line.me/fx/clip/clip10.jpg",
          size: "full",
          aspectMode: "cover",
          aspectRatio: "320:213"
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "Brown Cafe",
              weight: "bold",
              size: "sm",
              wrap: true
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "東京旅行",
                      wrap: true,
                      color: "#8c8c8c",
                      size: "xs",
                      flex: 5
                    }
                  ]
                }
              ]
            }
          ],
          spacing: "sm",
          paddingAll: "13px"
        }
      },
      {
        type: "bubble",
        size: "micro",
        hero: {
          type: "image",
          url: "https://developers-resource.landpress.line.me/fx/clip/clip11.jpg",
          size: "full",
          aspectMode: "cover",
          aspectRatio: "320:213"
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "Brown&Cony's Restaurant",
              weight: "bold",
              size: "sm",
              wrap: true
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "東京旅行",
                      wrap: true,
                      color: "#8c8c8c",
                      size: "xs",
                      flex: 5
                    }
                  ]
                }
              ]
            }
          ],
          spacing: "sm",
          paddingAll: "13px"
        }
      },
      {
        type: "bubble",
        size: "micro",
        hero: {
          type: "image",
          url: "https://developers-resource.landpress.line.me/fx/clip/clip12.jpg",
          size: "full",
          aspectMode: "cover",
          aspectRatio: "320:213"
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "Tata",
              weight: "bold",
              size: "sm"
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "東京旅行",
                      wrap: true,
                      color: "#8c8c8c",
                      size: "xs",
                      flex: 5
                    }
                  ]
                }
              ]
            }
          ],
          spacing: "sm",
          paddingAll: "13px"
        }
      }
    ]
  }
  // 特定字回覆
  // if (eventMsg == '你好') {
  //   flexMsg.contents.body.contents = [{
  //     type: 'text',
  //     text: '很高興為您服務'
  //   }]
  // }
  // if(eventMsg == '優惠券') {
  //   let cupon = await getCupon()
  //   flexMsg.contents.body.contents = cupon.map((item, index)=> {
  //     return {
  //       type: 'text',
  //       text: index+1 + '.' + item.title
  //     }
  //   })
  // }
  if(eventMsg == '優惠券列表') {
    let cupon = await getCupon()
    carousel.contents = cupon.map((item) => {
      console.log(item, 'iiiiii')
      return {
        type: "bubble",
        size: "micro",
        hero: {
          type: "image",
          url: item.cover,
          size: "full",
          aspectMode: "cover",
          aspectRatio: "320:213"
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: item.title,
              weight: "bold",
              size: "sm",
              wrap: true
            },
            {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: item.content,
                      wrap: true,
                      color: "#8c8c8c",
                      size: "xs",
                      flex: 5
                    }
                  ]
                }
              ]
            }
          ],
          spacing: "sm",
          paddingAll: "13px",
          action: {
            type: "uri",
            label: "action",
            uri: liffUrl +'articles/'+item.id
          }
        }
      }
    })
    // console.log(carousel, 'uuuuuuuuuuuuuu')

    flexMsg.contents = carousel
  }

  if (flexMsg.contents) {
    // use reply API
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [flexMsg],
    });
  } else {
    return noMsg
  }
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
