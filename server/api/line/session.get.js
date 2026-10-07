import { requireLineUser } from '../../utils/line-session.js'
export default defineEventHandler(event => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const user = requireLineUser(event)
  return { userId: user.sub, displayName: user.name, pictureUrl: user.picture }
})
