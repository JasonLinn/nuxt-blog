import { verifyJwt } from '../utils/jwtSecret.js'

const urls = [
  {
    path: '/api/articles',
    method: 'POST'
  },
  {
    path: /^\/api\/articles\/(.*)($|\?.*|#.*)/,
    method: 'DELETE'
  },
  {
    path: /^\/api\/articles\/(.*)($|\?.*|#.*)/,
    method: 'PATCH'
  }
]

export default defineEventHandler((event) => {
  const requireVerify = urls.some((apiUrl) => {
    if (event.method === apiUrl.method) {
      if (apiUrl.path instanceof RegExp) {
        return apiUrl.path.test(event.path)
      }

      return event.path === apiUrl.path
    }

    return false
  })

  if (!requireVerify) {
    return
  }
  const jwtToken = getCookie(event, 'access_token')

  if (jwtToken) {
    try {
      const { data: user } = verifyJwt(jwtToken, 'user', event)

      event.context.auth = {
        user
      }
    } catch (error) {
      console.error(error)
    }
  }
})
