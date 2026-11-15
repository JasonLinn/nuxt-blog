import { createError, defineEventHandler, getQuery, setHeader } from 'h3'
import { requireAdmin } from '../../utils/admin-auth.js'
import { query } from '../../utils/db.js'
import { incidentIdPattern } from '../../../utils/upload-failures.js'

export default defineEventHandler(async event => {
  requireAdmin(event)
  setHeader(event, 'Cache-Control', 'private, no-store')
  const { id, day } = getQuery(event)
  let condition, value
  if (id) {
    if (!incidentIdPattern.test(id)) throw createError({ statusCode: 400, message: '查詢碼格式有誤' })
    condition = 'id = $1'
    value = id
  } else {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '') || !Number.isFinite(Date.parse(day)) || new Date(day).toISOString().slice(0, 10) !== day) throw createError({ statusCode: 400, message: '請選擇日期' })
    condition = "occurred_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Taipei') AND occurred_at < (($1::date + 1)::timestamp AT TIME ZONE 'Asia/Taipei')"
    value = day
  }
  const { rows } = await query(`SELECT * FROM upload_failures WHERE ${condition} ORDER BY occurred_at DESC LIMIT 201`, [value])
  return { rows: rows.slice(0, 200), truncated: rows.length > 200 }
})
