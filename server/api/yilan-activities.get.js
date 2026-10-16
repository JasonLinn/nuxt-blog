import { getAdmin } from '../utils/admin-auth.js'
import { publicActivity } from '../utils/security.js'
import { query } from '~/server/utils/db.js'
import { activityWindow } from '../../utils/activity-dates.js'

export default defineEventHandler(async event => {
  const input = getQuery(event)
  const admin = getAdmin(event)
  const status = admin ? input.status : 'approved'
  setHeader(event, 'Cache-Control', 'private, no-store')
  const params = [], conditions = []
  if (status) { params.push(status); conditions.push(`status = $${params.length}`) }
  const filter = input.dateFilter === 'all' && !admin ? 'upcoming' : input.dateFilter
  const [start, end] = activityWindow(filter)
  if (start) { params.push(start); conditions.push(`COALESCE(end_date, event_date) >= $${params.length}`) }
  if (end) { params.push(end); conditions.push(`${filter === 'past' ? 'COALESCE(end_date, event_date)' : 'event_date'} <= $${params.length}`) }
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : ''
  const countParams = [...params]
  const paging = (value, fallback, max) => Math.min(max, Math.max(0, Number.parseInt(value, 10) || fallback))
  let pagination = ''
  if (input.limit) { params.push(paging(input.limit, 100, 500)); pagination += ` LIMIT $${params.length}` }
  if (input.offset) { params.push(paging(input.offset, 0, 100000)); pagination += ` OFFSET $${params.length}` }
  const order = filter === 'past' ? 'COALESCE(end_date, event_date) DESC' : 'event_date ASC'
  const [result, count] = await Promise.all([
    query(`SELECT id, title, description, images, event_date, event_time, end_date, end_time, is_multi_day,
      location, activity_type, organizer_name, organizer_email, organizer_phone, contact_info,
      status, rejection_reason, submitter_name, submitter_email, admin_notes,
      created_at, updated_at, approved_at, approved_by,
      to_jsonb(yilan_activities)->>'image_source_name' AS image_source_name,
        to_jsonb(yilan_activities)->>'image_source_url' AS image_source_url,
        to_jsonb(yilan_activities)->>'source_name' AS source_name,
      to_jsonb(yilan_activities)->>'source_url' AS source_url,
      to_jsonb(yilan_activities)->>'last_synced_at' AS last_synced_at
      FROM yilan_activities${where} ORDER BY ${order}, created_at DESC${pagination}`, params),
    query(`SELECT COUNT(*) AS total FROM yilan_activities${where}`, countParams)
  ])
  return { success: true, data: admin ? result.rows : result.rows.map(publicActivity), total: Number(count.rows[0].total) }
})
