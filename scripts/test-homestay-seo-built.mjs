// Start the production build separately, then run: node scripts/test-homestay-seo-built.mjs
// Uses public read endpoints (detail requests retain the application's view counter behavior).
import assert from 'node:assert/strict';

const base = process.env.SEO_TEST_BASE_URL || 'http://127.0.0.1:3108';
const origin = 'https://yilanpass.com';
const response = await fetch(`${base}/api/fetchBnbs?limit=1`);
const data = await response.json();
assert.equal(data.success, true);
assert.ok(data.total_count > 0, 'The test requires published homestay data');
const pages = Math.ceil(data.total_count / 12);
const ids = new Set();
const schemas = html => [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));

for (let page = 1; page <= pages; page++) {
  const path = `/homestay-list${page > 1 ? `?page=${page}` : ''}`;
  const r = await fetch(base + path);
  const html = await r.text();
  assert.equal(r.status, 200, path);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*>/g) || [];
  assert.equal(canonical.length, 1);
  assert.ok(canonical[0].includes(`href="${origin}${path}"`));
  const links = [...html.matchAll(/href="\/homestays\/([^"?#]+)"/g)].map(m => m[1]);
  assert.equal(links.length, Math.min(12, data.total_count - (page - 1) * 12));
  for (const id of links) {
    assert.ok(!ids.has(id), `Duplicate homestay across pages: ${id}`);
    ids.add(id);
  }
  const list = schemas(html).find(s => s['@type'] === 'ItemList');
  assert.equal(list.numberOfItems, links.length);
  assert.deepEqual(list.itemListElement.map(item => item.url.split('/').pop()), links);
  assert.equal(list.itemListElement[0].position, (page - 1) * 12 + 1);
  if (page < pages) assert.ok(html.includes(`href="/homestay-list?page=${page + 1}"`));
}
assert.equal(ids.size, data.total_count);

for (const path of ['/homestay-list?page=abc', '/homestay-list?page=0', '/homestay-list?page=2&page=3', `/homestay-list?page=${pages + 1}`, '/homestays/seo-nonexistent-record']) {
  assert.equal((await fetch(base + path)).status, 404, path);
}
const detailId = [...ids].find(id => id.startsWith('0')) || [...ids][0];
const detail = await fetch(`${base}/homestays/${detailId}`);
assert.equal(detail.status, 200);
const html = await detail.text();
const schema = schemas(html);
assert.equal(schema.length, 1, 'No hidden FAQ markup');
assert.equal(schema[0]['@type'], 'LodgingBusiness');
assert.equal(schema[0].url, `${origin}/homestays/${detailId}`);
assert.doesNotMatch(schema[0].priceRange || '', /NT\$NT\$/);
for (const key of ['paymentAccepted', 'checkinTime', 'checkoutTime', 'aggregateRating']) assert.equal(key in schema[0], false);
assert.ok(html.includes(schema[0].name));
assert.ok(!/<title>[^<]*電子優惠券/.test(html));
const robots = await (await fetch(base + '/robots.txt')).text();
assert.doesNotMatch(robots, /Disallow: \/_nuxt\//);
assert.match(robots, /Allow: \/api\/fetchBnbs/);
for (const path of ['/homestay-login', '/homestay-register', '/homestay-admin']) {
  const r = await fetch(base + path, { redirect: 'manual' });
  assert.equal(r.headers.get('x-robots-tag'), 'noindex, follow', path);
}
const sitemap = await (await fetch(base + '/sitemap.xml')).text();
const sitemapIds = [...sitemap.matchAll(/<loc>https:\/\/yilanpass.com\/homestays\/([^<]+)<\/loc>/g)].map(m => m[1]);
assert.deepEqual(new Set(sitemapIds), ids);
console.log(`SEO production-build checks passed: ${ids.size} unique homestays across ${pages} SSR pages; canonical, JSON-LD, pagination, 404, robots and sitemap verified.`);
