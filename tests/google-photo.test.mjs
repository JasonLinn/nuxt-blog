import test from 'node:test'
import assert from 'node:assert/strict'
import { googlePhotoParams, fetchGooglePhoto } from '../server/utils/google-photo.js'

test('photo request uses documented Google parameters and returns bytes without exposing the private key', async () => {
  const params = googlePhotoParams({ photo_reference: 'sample-reference', maxwidth: '400' })
  const image = await fetchGooglePhoto(params, 'server-only-key', async url => {
    assert.equal(url.origin, 'https://maps.googleapis.com')
    assert.equal(url.searchParams.get('photo_reference'), 'sample-reference')
    assert.equal(url.searchParams.get('maxwidth'), '400')
    assert.equal(url.searchParams.get('key'), 'server-only-key')
    return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/jpeg' } })
  })
  assert.equal(image.type, 'image/jpeg')
  assert.deepEqual(image.bytes, Buffer.from([1, 2, 3]))
})

test('photo proxy rejects invalid identifiers, invalid dimensions and non-image responses', async () => {
  for (const input of [{ photo_reference: 'https://attacker/' }, { photo_reference: 'ok', maxwidth: 1601 }, { photo_reference: 'ok', maxwidth: [] }]) assert.throws(() => googlePhotoParams(input), { statusCode: 400 })
  await assert.rejects(fetchGooglePhoto(googlePhotoParams({ photo_reference: 'ok' }), 'key', async () => new Response('secret error', { headers: { 'content-type': 'text/html' } })), { statusCode: 502 })
})

test('photo proxy stops reading oversized streams', async () => {
  let read = 0
  const fetcher = async () => ({ ok: true, headers: new Headers({ 'content-type': 'image/png' }), body: (async function* () {
    for (let i = 0; i < 100; i++) { read++; yield Buffer.alloc(1024 * 1024) }
  })() })
  await assert.rejects(fetchGooglePhoto(googlePhotoParams({ photo_reference: 'ok' }), 'key', fetcher), { statusCode: 502 })
  assert.equal(read, 6)
})
