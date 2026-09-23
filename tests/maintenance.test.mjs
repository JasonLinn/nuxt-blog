import test from 'node:test'
import assert from 'node:assert/strict'

globalThis.defineEventHandler = fn => fn
globalThis.setResponseHeader = (event, key, value) => { event.headers[key] = value }
globalThis.createError = properties => Object.assign(new Error(properties.message), properties)
const { default: handler } = await import('../server/middleware/00-maintenance.js')

test('maintenance is opt-in and blocks requests with non-cacheable 503', () => {
  const previous = process.env.SITE_MAINTENANCE_MODE
  try {
    delete process.env.SITE_MAINTENANCE_MODE
    assert.equal(handler({ headers: {} }), undefined)
    process.env.SITE_MAINTENANCE_MODE = 'false'
    assert.equal(handler({ headers: {} }), undefined)
    process.env.SITE_MAINTENANCE_MODE = 'true'
    for (const method of ['GET', 'POST']) {
      const event = { method, headers: {} }
      assert.throws(() => handler(event), error => error.statusCode === 503)
      assert.equal(event.headers['Cache-Control'], 'no-store')
      assert.equal(event.headers['Retry-After'], '1200')
    }
  } finally {
    if (previous === undefined) delete process.env.SITE_MAINTENANCE_MODE
    else process.env.SITE_MAINTENANCE_MODE = previous
  }
})
