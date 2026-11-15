import { getAdmin } from '../../utils/admin-auth.js'
import { query } from '../../utils/db.js'

export default defineEventHandler(async event => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const id = getRouterParam(event, 'id')
  const notFound = () => createError({ statusCode: 404, statusMessage: 'Image not found' })
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(id)) throw notFound()

  const { rows } = await query(`
    SELECT i.image_data FROM activity_submission_images i
    JOIN yilan_activities a ON a.id = i.activity_id
    WHERE i.id = $1 AND ($2::boolean OR a.status = 'approved')
      AND $3 = ANY(a.images)
  `, [id, Boolean(getAdmin(event)), `/api/activity-submission-images/${id}`])
  if (!rows.length) throw notFound()
  setHeader(event, 'Content-Type', 'image/webp')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  return rows[0].image_data
})
