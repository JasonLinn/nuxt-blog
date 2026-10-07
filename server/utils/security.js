import { createError } from 'h3'
import { timingSafeEqual } from 'node:crypto'

export function requiredSecret(name) {
  const value = process.env[name]
  if (!value) throw createError({ statusCode: 503, statusMessage: `Missing server configuration: ${name}` })
  return value
}

export function equalSecret(actual, expected) {
  if (typeof actual !== 'string' || typeof expected !== 'string') return false
  const a = Buffer.from(actual), b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export const activityFields = new Set(['title', 'description', 'event_date', 'end_date', 'event_time', 'end_time', 'is_multi_day', 'location', 'activity_type', 'organizer_name', 'organizer_email', 'organizer_phone', 'organizer_contact', 'contact_info', 'submitter_name', 'submitter_email', 'admin_notes', 'images', 'status', 'rejection_reason'])

export function validateActivityUpdate(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).some(key => !activityFields.has(key))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid activity fields' })
  }
  if (data.status !== undefined && !['pending', 'approved', 'rejected'].includes(data.status)) throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  if (data.images !== undefined && (!Array.isArray(data.images) || data.images.length > 10 || data.images.some(url => typeof url !== 'string' || !/^(https?:\/\/|\/(?!\/))/.test(url)))) throw createError({ statusCode: 400, statusMessage: 'Invalid images' })
  if (data.title !== undefined && (typeof data.title !== 'string' || !data.title.trim())) throw createError({ statusCode: 400, statusMessage: 'Title is required' })
  return data
}

export function publicActivity(row) {
  const { submitter_name, submitter_email, admin_notes, rejection_reason, approved_by, ...publicRow } = row
  return publicRow
}
