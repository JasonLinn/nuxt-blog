import test from 'node:test'
import assert from 'node:assert/strict'

const { getJwtSecret } = await import('../server/utils/jwtSecret.js')
const secretEnvNames = ['JWT_SECRET_ADMIN', 'JWT_SECRET_HOMESTAY', 'JWT_SECRET_USER']

test('reads distinct JWT secrets from private runtime config', () => {
  const previousEnv = Object.fromEntries(secretEnvNames.map(name => [name, process.env[name]]))
  for (const name of secretEnvNames) delete process.env[name]
  globalThis.useRuntimeConfig = () => ({
    JWT_SECRET_ADMIN: 'admin-secret',
    JWT_SECRET_HOMESTAY: 'homestay-secret',
    JWT_SECRET_USER: 'user-secret'
  })

  assert.equal(getJwtSecret('admin'), 'admin-secret')
  assert.equal(getJwtSecret('homestay'), 'homestay-secret')
  assert.equal(getJwtSecret('user'), 'user-secret')

  for (const name of secretEnvNames) {
    if (previousEnv[name] === undefined) delete process.env[name]
    else process.env[name] = previousEnv[name]
  }
})

test('prefers the named environment variable', () => {
  const previous = process.env.JWT_SECRET_ADMIN
  process.env.JWT_SECRET_ADMIN = 'environment-secret'
  globalThis.useRuntimeConfig = () => ({ JWT_SECRET_ADMIN: 'runtime-secret' })

  try {
    assert.equal(getJwtSecret('admin'), 'environment-secret')
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET_ADMIN
    else process.env.JWT_SECRET_ADMIN = previous
  }
})

test('fails clearly when a JWT secret is missing or token type is unsupported', () => {
  const previousEnv = Object.fromEntries(secretEnvNames.map(name => [name, process.env[name]]))
  for (const name of secretEnvNames) delete process.env[name]
  globalThis.useRuntimeConfig = () => ({})

  assert.throws(() => getJwtSecret('admin'), /JWT_SECRET_ADMIN is required/)
  assert.throws(() => getJwtSecret('homestay'), /JWT_SECRET_HOMESTAY is required/)
  assert.throws(() => getJwtSecret('user'), /JWT_SECRET_USER is required/)
  assert.throws(() => getJwtSecret('unknown'), /Unsupported JWT token type/)

  for (const name of secretEnvNames) {
    if (previousEnv[name] === undefined) delete process.env[name]
    else process.env[name] = previousEnv[name]
  }
})
