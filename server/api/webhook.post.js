export default defineEventHandler((event) => {
    console.log(event, 'eeee')
    try {
        return {
            statusCode: 200,
        }
      } catch (e) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized'
        })
      }
})
