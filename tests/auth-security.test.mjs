import test from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

globalThis.defineEventHandler = (handler) => handler
globalThis.createError = (options) => Object.assign(new Error(options.statusMessage), options)
globalThis.readBody = (event) => event.body
globalThis.getCookie = (event, name) => event.cookies?.[name]
globalThis.setCookie = (event, name, value, options) => {
  event.cookies ??= {}
  event.cookies[name] = { value, options }
}
globalThis.useRuntimeConfig = () => ({})

const previousHomestayDatabaseUrl = process.env.HOMESTAY_DATABASE_URL
const testDatabaseCredentials = ['test', 'fixture'].join(':')
process.env.HOMESTAY_DATABASE_URL = `postgres://${testDatabaseCredentials}@localhost/neondb?sslmode=require`

const { verifyBcryptPassword } = await import('../server/utils/adminCredentials.js')
const { signJwt, verifyJwt } = await import('../server/utils/jwtSecret.js')
const { default: adminLogin } = await import('../server/api/admin-login.post.js')
const { default: legacyLogin } = await import('../server/api/login.post.js')
const { default: adminAuth } = await import('../server/api/admin-auth.get.js')
const { default: homestayLogin } = await import('../server/api/homestay-login.post.js')
const { pool } = await import('../server/utils/db.js')

if (previousHomestayDatabaseUrl === undefined) delete process.env.HOMESTAY_DATABASE_URL
else process.env.HOMESTAY_DATABASE_URL = previousHomestayDatabaseUrl

const credentialEnv = [
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD_HASH',
  'JWT_SECRET_ADMIN',
  'JWT_SECRET_HOMESTAY',
  'JWT_SECRET_USER'
]

function withEnv(values, callback) {
  const previous = Object.fromEntries(credentialEnv.map((key) => [key, process.env[key]]))
  for (const key of credentialEnv) delete process.env[key]
  Object.assign(process.env, values)

  return Promise.resolve()
    .then(callback)
    .finally(() => {
      for (const key of credentialEnv) {
        if (previous[key] === undefined) delete process.env[key]
        else process.env[key] = previous[key]
      }
    })
}

test('bcrypt verification rejects missing, plaintext, and malformed homestay hashes', async () => {
  const validHash = await bcrypt.hash('test-homestay-password', 4)

  assert.equal(await verifyBcryptPassword('test-homestay-password', validHash), true)
  assert.equal(await verifyBcryptPassword('wrong-password', validHash), false)
  assert.equal(await verifyBcryptPassword('test-homestay-password', null), false)
  assert.equal(await verifyBcryptPassword('test-homestay-password', ''), false)
  assert.equal(await verifyBcryptPassword('test-homestay-password', 'plaintext'), false)
})

test('JWT signing and verification enforce HS256, expiry, and the required role', async () => {
  await withEnv(
    {
      JWT_SECRET_ADMIN: 'test-admin-secret',
      JWT_SECRET_HOMESTAY: 'test-homestay-secret',
      JWT_SECRET_USER: 'test-user-secret'
    },
    () => {
      const validToken = signJwt(
        {
          exp: Math.floor(Date.now() / 1000) + 60,
          data: { type: 'admin' }
        },
        'admin'
      )
      assert.equal(verifyJwt(validToken, 'admin').data.type, 'admin')
      const [header, payload, signature] = validToken.split('.')
      const tamperedToken = `${header}.${payload}.${
        signature[0] === 'A' ? 'B' : 'A'
      }${signature.slice(1)}`
      assert.throws(() => verifyJwt(tamperedToken, 'admin'))

      const expiredToken = jwt.sign(
        {
          exp: Math.floor(Date.now() / 1000) - 1,
          data: { type: 'admin' }
        },
        process.env.JWT_SECRET_ADMIN,
        { algorithm: 'HS256' }
      )
      assert.throws(() => verifyJwt(expiredToken, 'admin'))

      const wrongRoleToken = jwt.sign(
        {
          exp: Math.floor(Date.now() / 1000) + 60,
          data: { type: 'homestay' }
        },
        process.env.JWT_SECRET_ADMIN,
        { algorithm: 'HS256' }
      )
      assert.throws(() => verifyJwt(wrongRoleToken, 'admin'), /role/)

      const unsignedToken = jwt.sign(
        {
          exp: Math.floor(Date.now() / 1000) + 60,
          data: { type: 'admin' }
        },
        '',
        { algorithm: 'none' }
      )
      assert.throws(() => verifyJwt(unsignedToken, 'admin'))
    }
  )
})

test('missing JWT secret for each role fails closed', async () => {
  for (const [type, variable] of [
    ['admin', 'JWT_SECRET_ADMIN'],
    ['homestay', 'JWT_SECRET_HOMESTAY'],
    ['user', 'JWT_SECRET_USER']
  ]) {
    await withEnv({}, () => {
      assert.throws(() => signJwt({ data: { type } }, type), new RegExp(`${variable} is required`))
    })
  }
})

test('admin and legacy login share bcrypt verification and preserve their responses', async () => {
  const passwordHash = await bcrypt.hash('test-admin-password', 4)
  await withEnv(
    {
      ADMIN_USERNAME: 'test-admin',
      ADMIN_PASSWORD_HASH: passwordHash,
      JWT_SECRET_ADMIN: 'test-admin-secret'
    },
    async () => {
      const adminEvent = { body: { username: 'test-admin', password: 'test-admin-password' } }
      const adminResponse = await adminLogin(adminEvent)
      assert.deepEqual(adminResponse, {
        success: true,
        message: '登入成功',
        admin: { username: 'test-admin', type: 'admin' }
      })
      assert.equal(adminEvent.cookies.admin_access_token.options.httpOnly, true)
      assert.equal(
        verifyJwt(adminEvent.cookies.admin_access_token.value, 'admin').data.type,
        'admin'
      )

      const legacyEvent = { body: { account: 'test-admin', password: 'test-admin-password' } }
      assert.equal(await legacyLogin(legacyEvent), '登入成功')
      assert.ok(legacyEvent.cookies.admin_access_token)

      for (const [handler, body] of [
        [adminLogin, { username: 'test-admin', password: 'wrong-password' }],
        [legacyLogin, { account: 'another-admin', password: 'test-admin-password' }]
      ]) {
        await assert.rejects(
          handler({ body }),
          (error) => error.statusCode === 401 && error.statusMessage === '帳號或密碼錯誤'
        )
      }
    }
  )
})

test('admin login fails closed without configured credentials and protected API rejects missing auth', async (t) => {
  await withEnv({}, async () => {
    await assert.rejects(
      adminLogin({ body: { username: 'test-admin', password: 'test-password' } }),
      (error) => error.statusCode === 500
    )

    t.mock.method(globalThis.console, 'error', () => {})
    await assert.rejects(adminAuth({ cookies: {} }), (error) => error.statusCode === 401)
  })
})

test('homestay login requires approved and available account with a bcrypt hash and preserves cookie and response', async (t) => {
  const passwordHash = await bcrypt.hash('test-homestay-password', 4)
  let storedHash = passwordHash
  const queryMock = t.mock.method(pool, 'query', (sql) => {
    if (sql.includes('SELECT')) {
      assert.match(sql, /available = true AND status = 'approved'/)
      return {
        rows: [
          {
            id: 'test-homestay',
            name: 'Test homestay',
            location: 'Yilan',
            password_hash: storedHash
          }
        ]
      }
    }
    return { rows: [], rowCount: 1 }
  })
  t.mock.method(globalThis.console, 'error', () => {})

  try {
    await withEnv({ JWT_SECRET_HOMESTAY: 'test-homestay-secret' }, async () => {
      const event = { body: { account: 'test-homestay', password: 'test-homestay-password' } }
      const response = await homestayLogin(event)
      assert.deepEqual(response, {
        success: true,
        message: '登入成功',
        homestay: { id: 'test-homestay', name: 'Test homestay', location: 'Yilan' }
      })
      assert.equal(event.cookies.homestay_access_token.options.httpOnly, true)
      assert.equal(
        verifyJwt(event.cookies.homestay_access_token.value, 'homestay').data.id,
        'test-homestay'
      )
      assert.equal(queryMock.mock.callCount(), 2)
    })

    await withEnv({ JWT_SECRET_HOMESTAY: 'test-homestay-secret' }, async () => {
      await assert.rejects(
        homestayLogin({ body: { account: 'test-homestay', password: 'wrong-password' } }),
        (error) => error.statusCode === 401
      )
    })

    for (const invalidHash of [null, '', 'plaintext']) {
      storedHash = invalidHash
      await withEnv({ JWT_SECRET_HOMESTAY: 'test-homestay-secret' }, async () => {
        await assert.rejects(
          homestayLogin({ body: { account: 'test-homestay', password: 'test-homestay-password' } }),
          (error) => error.statusCode === 401
        )
      })
    }
  } finally {
    queryMock.mock.restore()
  }
})
