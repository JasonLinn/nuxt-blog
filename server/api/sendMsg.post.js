import { requiredSecret } from '../utils/security.js'
import { requireAdmin } from '../utils/admin-auth.js'
import axios from "axios"

export default defineEventHandler(async (event) => {
  requireAdmin(event)
    const body = await readBody(event)

    if (typeof body.id !== 'string' || !/^U[a-f0-9]{32}$/.test(body.id) || typeof body.text !== 'string' || !body.text.length || body.text.length > 5000) throw createError({ statusCode: 400, statusMessage: 'Invalid message' })
    await axios({
        "url": 'https://api.line.me/v2/bot/message/push',
        "headers": {
            'Content-Type': 'application/json',
            "Authorization": 'Bearer ' + requiredSecret('LINE_MESSAGE_ACCESS_TOKEN'),
        },
        "method": 'POST',
        "data": {
            "to": body.id,
            "messages": [
                {
                    "type": "text",
                    "text": body.text
                }
            ]
        }
    }).catch(() => { throw createError({ statusCode: 502, statusMessage: 'LINE delivery failed' }) })
})
