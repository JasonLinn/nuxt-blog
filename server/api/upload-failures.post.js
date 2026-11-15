import { createError, defineEventHandler, getHeader, readRawBody } from 'h3'
import { enforceQuota } from '../utils/rate-limit.js'
import { saveFailure, validateFailure } from '../utils/upload-failures.js'

export default defineEventHandler(async event => {
  if (!getHeader(event, 'content-type')?.startsWith('application/json')) throw createError({ statusCode: 415 })
  if (Number(getHeader(event, 'content-length')) > 2048) throw createError({ statusCode: 413 })
  const raw = await readRawBody(event, false)
  if (!raw || raw.length > 2048) throw createError({ statusCode: raw ? 413 : 400 })
  let data
  try { data = JSON.parse(raw.toString('utf8')) } catch { throw createError({ statusCode: 400 }) }
  const record = validateFailure(data)
  await enforceQuota(event, 'upload-failures', 60, 5000)
  await saveFailure(record, 'browser')
  return { recorded: true }
})
