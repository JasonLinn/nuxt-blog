import { defineEventHandler, getRequestURL, getHeader, createError } from 'h3'
import { enforceQuota } from '../utils/rate-limit.js'
import { requireUploader } from '../utils/upload-auth.js'
import { requireAdmin } from '../utils/admin-auth.js'

const uploadPaths = ['/api/upload', '/api/upload-local', '/api/coupons/upload']
const submissionPaths = ['/api/activities', '/api/yilan-activities', '/api/places/submit', '/api/coupons/submit']

export default defineEventHandler(async event => {
  const pathname = getRequestURL(event).pathname.toLowerCase().replace(/\/+$/, '')
  const isUpload = uploadPaths.includes(pathname)
  if (['/api/upload', '/api/upload-local', '/api/activities'].includes(pathname) && event.method === 'POST') requireUploader(event)
  if (['/api/sendMsg', '/api/ai/extract-activity-info'].includes(pathname)) requireAdmin(event)
  if (/^\/api\/google\/places\//.test(pathname) || pathname === '/api/maps') {
    await enforceQuota(event, 'google', 60, 2000)
  } else if ((isUpload || submissionPaths.includes(pathname)) && event.method === 'POST') {
    const length = Number(getHeader(event, 'content-length') || 0)
    if (length > 26 * 1024 * 1024) throw createError({ statusCode: 413, statusMessage: 'Upload too large' })
    await enforceQuota(event, isUpload ? 'uploads' : 'submissions', isUpload ? 20 : 5, isUpload ? 1000 : 200)
  } else if (['/api/login', '/api/admin-login', '/api/homestay-login', '/api/line/session', '/api/line/callback'].includes(pathname) && event.method === 'POST') {
    await enforceQuota(event, 'login', 15, 3000)
  } else if (['/api/sendMsg', '/api/ai/extract-activity-info'].includes(pathname)) {
    await enforceQuota(event, 'paid-admin', 10, 200)
  }
})
