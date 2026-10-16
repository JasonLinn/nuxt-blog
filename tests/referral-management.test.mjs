import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ref, computed } from 'vue'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { availableReferralCodes, referralRevision, validateReferralItems } from '../server/utils/referral-management.js'

test('validation rejects duplicate codes regardless of case or surrounding whitespace', () => {
  assert.throws(() => validateReferralItems([
    { code: '2026ABC', name: 'Shop A' }, { code: ' 2026abc ', name: 'Shop B' }
  ]), /重複/)
  assert.throws(() => validateReferralItems([{ code: ' ', name: 'Shop A' }]), /不可空白/)
  assert.deepEqual(validateReferralItems([{ code: 'jinbnb', name: '' }]), [{ code: 'jinbnb', name: '' }])
})

test('available list excludes registered codes and revisions track assignments', () => {
  const candidates = availableReferralCodes([])
  assert.ok(candidates.length > 0)
  assert.ok(!availableReferralCodes([{ code: candidates[0].toLowerCase(), name: 'Taken' }]).includes(candidates[0]))
  const rows = [{ code: 'A', name: 'First' }, { code: 'B', name: 'Second' }]
  assert.equal(referralRevision(rows), referralRevision([...rows].reverse()))
  assert.notEqual(referralRevision(rows), referralRevision([{ code: 'A', name: 'Other' }, rows[1]]))
})

async function makeApi(initialRows) {
  let rows = structuredClone(initialRows)
  let queue = Promise.resolve()
  const queries = []
  const pool = {
    query: async () => ({ rows: structuredClone(rows) }),
    connect: async () => {
      let unlock
      let pending
      return {
        async query(sql, values) {
          const command = sql.trim()
          queries.push(command)
          if (command.startsWith('LOCK TABLE')) {
            const previous = queue
            queue = new Promise(resolve => { unlock = resolve })
            await previous
          } else if (command.startsWith('SELECT')) {
            return { rows: structuredClone(rows) }
          } else if (command.startsWith('TRUNCATE')) {
            pending = []
          } else if (command.startsWith('INSERT')) {
            pending.push({ code: values[0], name: values[1] })
          } else if (command === 'COMMIT') {
            rows = pending
            unlock?.()
          } else if (command === 'ROLLBACK') {
            unlock?.()
          }
          return { rows: [] }
        },
        release() {}
      }
    }
  }
  const source = (await readFile(new URL('../server/api/referral-manage.ts', import.meta.url), 'utf8'))
    .replace(/^import .*\r?\n/gm, '').replace('export default', 'return')
  const handler = new Function('requireAdmin', 'readBody', 'pool', 'availableReferralCodes', 'referralRevision', 'validateReferralItems', 'defineEventHandler', source)(
    () => {}, async event => event.body, pool, availableReferralCodes, referralRevision, validateReferralItems, handler => handler
  )
  return { handler, queries, rows: () => rows }
}

test('API rejects duplicates and outdated clients before modifying stored records', async () => {
  const initial = [{ code: '2026ABC', name: 'Existing' }]
  const api = await makeApi(initial)
  const invalid = await api.handler({ method: 'POST', body: {
    revision: referralRevision(initial), items: [...initial, { code: '2026abc', name: 'Duplicate' }]
  } })
  assert.equal(invalid.success, false)
  assert.match(invalid.message, /重複/)
  assert.equal((await api.handler({ method: 'POST', body: initial })).success, false)
  assert.equal(api.queries.length, 0)
  assert.deepEqual(api.rows(), initial)
})

test('concurrent editors cannot allocate one code to two different shops', async () => {
  const initial = [{ code: 'jinbnb', name: 'Existing' }]
  const api = await makeApi(initial)
  const snapshot = await api.handler({ method: 'GET' })
  const responses = await Promise.all(['Shop A', 'Shop B'].map(name => api.handler({ method: 'POST', body: {
    revision: snapshot.revision,
    items: [...initial, { code: '2026PKS', name }]
  } })))
  assert.equal(responses.filter(result => result.success).length, 1)
  assert.match(responses.find(result => !result.success).message, /其他視窗更新/)
  assert.deepEqual(api.rows(), [...initial, { code: '2026PKS', name: 'Shop A' }])
  assert.equal(api.queries.filter(sql => sql.startsWith('TRUNCATE')).length, 1)
})

test('page auto-fills available codes, skips collisions and blocks duplicate manual edits', async () => {
  const source = await readFile(new URL('../pages/admin/referral.vue', import.meta.url), 'utf8')
  const { descriptor, errors } = parse(source)
  assert.deepEqual(errors, [])
  compileScript(descriptor, { id: 'referral-test' })
  assert.deepEqual(compileTemplate({ source: descriptor.template.content, filename: 'referral.vue', id: 'referral-test' }).errors, [])
  const year = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'Asia/Taipei' }).format(new Date())
  const alerts = []
  const posts = []
  const original = { code: `${year}AAA`, name: 'Existing' }
  const page = new Function('ref', 'computed', 'definePageMeta', 'onMounted', '$fetch', 'alert', 'confirm', descriptor.scriptSetup.content + '\nreturn { list, searchQuery, addItem, fetchData, saveData };')(
    ref, computed, () => {}, () => {}, async (url, options) => {
      if (options) { posts.push(options.body); return { success: false, message: 'Conflict' } }
      return { success: true, data: [original], revision: 'snapshot', availableCodes: [`${year}AAA`, `${year}PKS`, `${year}PKX`] }
    }, message => alerts.push(message), () => true
  )
  page.addItem()
  assert.equal(page.list.value.length, 0)
  await page.fetchData()
  page.searchQuery.value = 'unrelated'
  page.addItem()
  assert.equal(page.list.value[0].code, `${year}PKS`)
  page.addItem()
  assert.equal(page.list.value[0].code, `${year}PKX`)
  assert.equal(page.searchQuery.value, '')
  for (let i = 0; i < 200; i++) page.addItem()
  assert.equal(new Set(page.list.value.map(item => item.code)).size, 203)
  page.list.value.forEach(item => { if (item.isNew) item.name = 'New shop' })
  page.list.value[0].code = ` ${year}aaa `
  await page.saveData()
  assert.match(alerts.at(-1), /重複/)
  assert.equal(posts.length, 0)
  page.list.value[0].code = 'CUSTOM-CODE'
  await page.saveData()
  assert.equal(posts[0].revision, 'snapshot')
  assert.equal(posts[0].items[0].code, 'CUSTOM-CODE')
  assert.equal(page.list.value.length, 203, 'failed save preserves local edits')
})
