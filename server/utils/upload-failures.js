import { randomUUID } from 'node:crypto'
import { createError } from 'h3'
import { query } from './db.js'
import { classifyFailure, couponFields, failureSources, failureStages, failureReasons, incidentIdPattern } from '../../utils/upload-failures.js'

export function validateFailure(data) {
  if (!data || typeof data.id !== 'string' || !incidentIdPattern.test(data.id)
    || typeof data.source !== 'string' || !Object.hasOwn(failureSources, data.source)
    || typeof data.stage !== 'string' || !Object.hasOwn(failureStages, data.stage)
    || typeof data.reason !== 'string' || !Object.hasOwn(failureReasons, data.reason)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid failure report' })
  }
  const time = Date.parse(data.at)
  return {
    id: data.id, source: data.source, stage: data.stage, reason: data.reason,
    at: Number.isFinite(time) && time <= Date.now() + 60000 && time >= Date.now() - 7 * 86400000 ? new Date(time) : new Date(),
    status: Number.isInteger(data.status) && data.status >= 400 && data.status <= 599 ? data.status : null,
    mime: ['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/heic','image/heif','other'].includes(data.mime) ? data.mime : null,
    bytes: Number.isSafeInteger(data.bytes) && data.bytes >= 0 ? data.bytes : null,
    detail: typeof data.detail === 'string' && Object.hasOwn(couponFields, data.detail) ? data.detail : null
  }
}

export async function saveFailure(record, reporter) {
  const {id, at, source, stage, reason, status, mime, bytes, detail} = validateFailure(record)
  const serverDetail = reporter === 'server' && /^(SQLSTATE [A-Z0-9]{5}|GitHub HTTP [45]\d{2})$/.test(record.detail) ? record.detail : detail
  await query(`INSERT INTO upload_failures (id, occurred_at, source, stage, reason, http_status, file_type, file_bytes, reporter, detail)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
  [id, at, source, stage, reason, status, mime, bytes, reporter, serverDetail])
}

export async function couponFailure(error, stage) {
  const record = { id: randomUUID(), at: new Date().toISOString(), source: 'coupon', stage, ...classifyFailure(error) }
  record.status ||= stage === 'upload' ? 502 : 500
  if (stage === 'submit' && !error?.statusCode && error?.code) record.reason = 'database'
  if (record.reason === 'database' && /^[A-Z0-9]{5}$/.test(error.code)) record.detail = `SQLSTATE ${error.code}`
  if (record.reason === 'storage' && error?.providerStatus) record.detail = `GitHub HTTP ${error.providerStatus}`
  if (record.reason === 'township') record.detail = 'township'
  if (record.reason === 'required') {
    const field = error.message.split(': ').pop()
    if (Object.hasOwn(couponFields, field)) record.detail = field
  }
  let saved = false
  try {
    await saveFailure(record, 'server')
    saved = true
  } catch {
    console.error('Coupon failure record pending', record.id, stage, record.reason)
  }
  return createError({ statusCode: record.status, message: failureReasons[record.reason], data: { incident: { ...record, saved } } })
}
