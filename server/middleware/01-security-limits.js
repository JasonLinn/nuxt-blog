import { defineEventHandler, getRequestURL, getHeader, createError } from 'h3'
import { enforceQuota } from '../utils/rate-limit.js'
import { requireUploader } from '../utils/upload-auth.js'
import { requireAdmin } from '../utils/admin-auth.js'

export default defineEventHandler(async event => {
  const pathname = getRequestURL(event).pathname.replace(/\/$/, '')
  if (['/api/upload', '/api/upload-local', '/api/activities', '/api/yilan-activities'].includes(pathname) && event.method === 'POST') requireUploader(event)
  if (['/api/sendMsg', '/api/ai/extract-activity-info'].includes(pathname)) requireAdmin(event)
  if (/^\/api\/google\/places\//.test(pathname) || pathname === '/api/maps') {
    await enforceQuota(event, 'google', 60, 2000)
  } else if (['/api/upload', '/api/upload-local', '/api/activities', '/api/yilan-activities', '/api/places/submit', '/api/coupons/submit'].includes(pathname) && event.method === 'POST') {
    const length = Number(getHeader(event, 'content-length') || 0)
    if (length > 26 * 1024 * 1024) throw createError({ statusCode: 413, statusMessage: 'Upload too large' })
    const isUpload = ['/api/upload', '/api/upload-local'].includes(pathname)
    await enforceQuota(event, isUpload ? 'uploads' : 'submissions', isUpload ? 20 : 5, isUpload ? 1000 : 200)
  } else if (['/api/login', '/api/admin-login', '/api/homestay-login', '/api/line/session', '/api/line/callback'].includes(pathname) && event.method === 'POST') {
    await enforceQuota(event, 'login', 15, 3000)
  } else if (['/api/sendMsg', '/api/ai/extract-activity-info'].includes(pathname)) {
    await enforceQuota(event, 'paid-admin', 10, 200)
  }
})
