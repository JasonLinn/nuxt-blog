import test from 'node:test'
import assert from 'node:assert/strict'
import config from '../utils/database-config.cjs'

const homestay = 'postgresql://owner:test@homestay.example/neondb?sslmode=require'
const marketing = 'postgresql://owner:test@marketing.example/nuxt-marketing?sslmode=require'
test('dedicated connections stay isolated even when legacy variables exist', () => {
  const env = { HOMESTAY_DATABASE_URL: homestay, MARKETING_DATABASE_URL: marketing, DATABASE_URL: marketing, POSTGRES_URL: marketing }
  assert.equal(config.databaseUrl('homestay', env), homestay)
  assert.equal(config.databaseUrl('marketing', env), marketing)
  assert.throws(() => config.databaseUrl('homestay', { DATABASE_URL: marketing }), /HOMESTAY_DATABASE_URL is required/)
  assert.throws(() => config.databaseUrl('marketing', { DATABASE_URL: marketing }), /MARKETING_DATABASE_URL is required/)
})
test('reject swapped databases and unsafe or malformed configuration without leaking credentials', () => {
  assert.throws(() => config.databaseUrl('homestay', { HOMESTAY_DATABASE_URL: marketing }), /dedicated neondb/)
  assert.throws(() => config.databaseUrl('marketing', { MARKETING_DATABASE_URL: homestay }), /nuxt-marketing/)
  for (const value of ['secret-value', homestay.replace('?sslmode=require', ''), homestay.replace('postgresql:', 'https:')]) {
    assert.throws(() => config.databaseUrl('homestay', { HOMESTAY_DATABASE_URL: value }), error => {
      assert.match(error.message, /^HOMESTAY_DATABASE_URL/)
      assert.ok(!error.message.includes(value))
      assert.ok(!error.message.includes('owner:test'))
      return true
    })
  }
})
