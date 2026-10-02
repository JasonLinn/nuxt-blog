import { createHash, timingSafeEqual } from 'node:crypto'
import bcrypt from 'bcryptjs'

const bcryptHashPattern = /^\$2[aby]\$\d{2}\$.{53}$/
let dummyHashPromise

function getAdminConfig(event) {
  const runtimeConfig = typeof useRuntimeConfig === 'function' ? useRuntimeConfig(event) : {}
  return {
    username: process.env.ADMIN_USERNAME || runtimeConfig.ADMIN_USERNAME,
    passwordHash: process.env.ADMIN_PASSWORD_HASH || runtimeConfig.ADMIN_PASSWORD_HASH
  }
}

function constantTimeStringEqual(left, right) {
  const leftHash = createHash('sha256').update(left).digest()
  const rightHash = createHash('sha256').update(right).digest()
  return timingSafeEqual(leftHash, rightHash)
}

export function isValidBcryptHash(hash) {
  return typeof hash === 'string' && bcryptHashPattern.test(hash)
}

export async function verifyBcryptPassword(password, hash) {
  if (typeof password !== 'string' || !isValidBcryptHash(hash)) return false

  try {
    return await bcrypt.compare(password, hash)
  } catch {
    return false
  }
}

export async function verifyAdminCredentials(username, password, event) {
  const { username: configuredUsername, passwordHash } = getAdminConfig(event)
  const validHash = isValidBcryptHash(passwordHash)
  const compareHash = validHash
    ? passwordHash
    : await (dummyHashPromise ||= bcrypt.hash('invalid-admin-password', 10))
  const passwordMatches = await bcrypt.compare(
    typeof password === 'string' ? password : '',
    compareHash
  )

  if (!configuredUsername || !validHash) {
    throw new Error('ADMIN_USERNAME and a valid ADMIN_PASSWORD_HASH are required')
  }

  const usernameMatches =
    typeof username === 'string' && constantTimeStringEqual(username, configuredUsername)
  return usernameMatches && passwordMatches
}

export function getAdminUsername(event) {
  return getAdminConfig(event).username
}
