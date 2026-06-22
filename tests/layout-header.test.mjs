import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'

test('public header does not expose the homestay registration link', async () => {
  const source = await readFile(new URL('../components/LayoutHeader.vue', import.meta.url), 'utf8')

  assert.equal(source.includes('/homestay-register'), false)
})
