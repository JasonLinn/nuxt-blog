import { randomUUID } from 'node:crypto'
import { readFile, rm } from 'node:fs/promises'
import formidable from 'formidable'
import { dateOnly } from '../../utils/activity-dates.js'
import { query } from '../utils/db.js'
import { normalizeImage } from '../utils/safe-images.js'
import { recordSuccess } from '../utils/upload-events.js'
import { verifyActivityChallenge } from '../utils/submission-turnstile.js'

const maxFileBytes = 4 * 1024 * 1024

function invalid(field) {
  return createError({ statusCode: 400, statusMessage: `Invalid field: ${field}` })
}

function activityFields(fields) {
  function field(key, max = 65535) {
    const raw = Array.isArray(fields[key]) ? fields[key][0] : fields[key]
    if (raw == null || raw === '') return null
    if (!['string', 'boolean', 'number'].includes(typeof raw)) throw invalid(key)
    const value = String(raw).trim()
    if (value.length > max || value.includes('\0')) throw invalid(key)
    return value || null
  }

  function integer(key, minimum) {
    const value = field(key)
    if (value === null) return null
    if (!/^\d+$/.test(value) || Number(value) < minimum || Number(value) > 2147483647) throw invalid(key)
    return Number(value)
  }

  const activity = {
    title: field('title', 255),
    description: field('description'),
    event_date: field('event_start_date', 10),
    end_date: field('event_end_date', 10),
    event_time: field('event_start_time', 8),
    end_time: field('event_end_time', 8),
    is_multi_day: field('is_multi_day') === 'true',
    location: field('location', 255),
    activity_type: field('activity_type', 100),
    organizer_name: field('organizer_name', 255),
    organizer_email: field('organizer_email', 255),
    organizer_phone: field('organizer_phone', 50),
    organizer_contact: field('organizer_contact'),
    submitter_name: field('submitter_name', 255) || field('organizer_name', 255),
    submitter_email: field('submitter_email', 255),
    price: integer('price', 0),
    capacity: integer('capacity', 1),
    website: field('website', 2048)
  }
  for (const key of ['title', 'event_date', 'organizer_name', 'submitter_name', 'submitter_email']) {
    if (!activity[key]) throw invalid(key)
  }
  for (const key of ['event_date', 'end_date']) {
    if (activity[key] && dateOnly(activity[key]) !== activity[key]) throw invalid(key)
  }
  if ((activity.is_multi_day && !activity.end_date) || (activity.end_date && activity.end_date < activity.event_date)) {
    throw invalid('end_date')
  }
  for (const key of ['event_time', 'end_time']) {
    if (activity[key] && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(activity[key])) throw invalid(key)
  }
  for (const key of ['organizer_email', 'submitter_email']) {
    if (activity[key] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(activity[key])) throw invalid(key)
  }
  if (activity.website && (!URL.canParse(activity.website) || !['http:', 'https:'].includes(new URL(activity.website).protocol))) {
    throw invalid('website')
  }
  return activity
}

export default defineEventHandler(async event => {
  await verifyActivityChallenge(event)
  const tempFiles = []
  try {
    let fields
    let files = {}
    if (getHeader(event, 'content-type')?.startsWith('multipart/form-data')) {
      const form = formidable({
        maxFields: 40, maxFieldsSize: 256 * 1024,
        maxFiles: 5, maxFileSize: maxFileBytes, maxTotalFileSize: maxFileBytes
      })
      form.on('fileBegin', (_name, file) => tempFiles.push(file.filepath))
      const parsed = await form.parse(event.node.req)
      fields = parsed[0]
      files = parsed[1]
    } else {
      fields = await readBody(event)
    }
    if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw invalid('form')
    if (Object.keys(files).some(key => key !== 'images')) throw invalid('images')
    const activity = activityFields(fields)

    const images = []
    for (const file of files.images || []) {
      const image = await normalizeImage(await readFile(file.filepath), 2048)
      if (image.data.length > maxFileBytes) throw createError({ statusCode: 413, statusMessage: 'Image too large' })
      images.push({ id: randomUUID(), data: image.data.toString('base64'), bytes: image.data.length })
    }
    const urls = images.map(image => `/api/activity-submission-images/${image.id}`)

    // The activity and its private images must be saved together, including on upload failure.
    const result = await query(`
      WITH submission AS (
        INSERT INTO yilan_activities (
          title, description, images, event_date, end_date, event_time, end_time, is_multi_day,
          location, activity_type, organizer_name, organizer_email, organizer_phone, organizer_contact,
          contact_info, submitter_name, submitter_email, price, capacity, website, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $14, $15, $16, $17, $18, $19, 'pending', now(), now()) RETURNING id
      ), saved_images AS (
        INSERT INTO activity_submission_images (id, activity_id, image_data)
        SELECT image.id, submission.id, decode(image.encoded, 'base64')
        FROM submission CROSS JOIN unnest($20::uuid[], $21::text[]) AS image(id, encoded)
      )
      SELECT id FROM submission
    `, [
      activity.title, activity.description, urls, activity.event_date, activity.end_date,
      activity.event_time, activity.end_time, activity.is_multi_day, activity.location,
      activity.activity_type, activity.organizer_name, activity.organizer_email, activity.organizer_phone,
      activity.organizer_contact, activity.submitter_name, activity.submitter_email, activity.price,
      activity.capacity, activity.website, images.map(image => image.id), images.map(image => image.data)
    ])
    const submissionId = result.rows[0].id
    await Promise.all([
      ...images.map(image => recordSuccess('activity', 'upload', { mime: 'image/webp', bytes: image.bytes, submissionId })),
      recordSuccess('activity', 'submit', { submissionId })
    ])
    setHeader(event, 'Cache-Control', 'no-store')
    return { success: true, data: { ...activity, id: result.rows[0].id, images: urls, status: 'pending' }, message: 'Activity submitted successfully' }
  } catch (error) {
    if (error.statusCode) throw error
    if (error.httpCode >= 400 && error.httpCode < 500) throw createError({ statusCode: error.httpCode, statusMessage: 'Invalid upload' })
    throw createError({ statusCode: 500, statusMessage: 'Failed to submit activity' })
  } finally {
    await Promise.all(tempFiles.map(file => rm(file, { force: true })))
  }
})
