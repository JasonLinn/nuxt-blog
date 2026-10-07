export default defineEventHandler(() => {
  throw createError({ statusCode: 410, statusMessage: 'LINE Notify is unavailable' })
})
