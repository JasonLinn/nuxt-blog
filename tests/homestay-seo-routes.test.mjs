import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createServer } from 'node:http';
import * as h3 from 'h3';

Object.assign(globalThis, h3);
await mkdir('.cache/seo-tests', { recursive: true });
async function load(name) {
  const outfile = resolve(`.cache/seo-tests/${name}.mjs`);
  await build({ entryPoints: [`server/api/${name}.js`], outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent', plugins: [{
    name: 'mock-db', setup(builder) {
      builder.onResolve({ filter: /\/db\.js$/ }, () => ({ path: 'db', namespace: 'test' }));
      builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const pool = { query: (...args) => globalThis.seoDb(...args) };' }));
    }
  }] });
  return (await import(pathToFileURL(outfile).href)).default;
}
async function request(handler, query) {
  const app = h3.createApp().use(handler);
  const server = createServer(h3.toNodeListener(app));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const r = await fetch(`http://127.0.0.1:${server.address().port}/?${query}`);
    return { status: r.status, body: await r.json() };
  } finally { await new Promise(resolve => server.close(resolve)); }
}
const detail = await load('fetchBnbDetail');
const list = await load('fetchBnbs');

test('unknown/unpublished detail is 404; database outage is 503, never a false removal', async () => {
  globalThis.seoDb = async sql => {
    if (sql.includes('FROM homestays')) assert.match(sql, /h\.status = 'approved'/);
    return { rows: [] };
  };
  assert.equal((await request(detail, 'id=missing')).status, 404);
  globalThis.seoDb = async () => { throw new Error('private database failure'); };
  const outage = await request(detail, 'id=070');
  assert.equal(outage.status, 503);
  assert.doesNotMatch(JSON.stringify(outage.body), /private database failure/);
});

test('out-of-range list retains total count and uses a stable approved-only ordering', async () => {
  globalThis.seoDb = async sql => {
    if (sql.includes('FROM homestays')) assert.match(sql, /h\.status = 'approved'/);
    if (sql.includes('COUNT(*)')) return { rows: [{ total: '42' }] };
    if (sql.includes('ORDER BY')) assert.match(sql, /NULLS LAST, h\.id ASC/);
    return { rows: [] };
  };
  const r = await request(list, 'page=99');
  assert.equal(r.status, 200);
  assert.equal(r.body.total_count, 42);
  assert.equal(r.body.total_pages, 4);
});
