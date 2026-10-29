import test from 'node:test';
import assert from 'node:assert/strict';
import { buildActivitySeo, taipeiDate } from '../utils/activity-seo.js';
import { serializeJsonLd } from '../utils/homestay-seo.js';

test('activity metadata uses its own URL, title and Taiwan dates', () => {
  const seo = buildActivitySeo({
    id: 75, title: '冬山河龍舟賽', description: '<p>年度<strong>龍舟</strong>盛事</p>',
    event_date: '2026-11-01T16:00:00.000Z', end_date: null, event_time: '09:00-17:00',
    location: '冬山河親水公園', organizer_name: '冬山鄉公所', images: ['/yilan-activities/a.jpg']
  });
  assert.equal(seo.url, 'https://yilanpass.com/yilan-activities/75');
  assert.equal(seo.title, '冬山河龍舟賽｜宜蘭活動總匯｜宜蘭旅遊通');
  assert.match(seo.description, /^2026-11-02，冬山河親水公園。年度 龍舟 盛事/);
  assert.equal(seo.image, 'https://yilanpass.com/yilan-activities/a.jpg');
  assert.equal(seo.schema['@type'], 'Event');
  assert.equal(seo.schema.startDate, '2026-11-02T09:00:00+08:00');
  assert.equal(seo.schema.endDate, '2026-11-02T17:00:00+08:00');
  assert.equal(seo.schema.location.name, '冬山河親水公園');
  assert.equal(seo.schema.organizer.name, '冬山鄉公所');
});

test('multi-day activities keep date-only boundaries and omit unknown facts', () => {
  const seo = buildActivitySeo({ id: 1, title: '展覽', event_date: '2026-12-01', end_date: '2026-12-31', event_time: '全天' });
  const schema = JSON.parse(serializeJsonLd(seo.schema));
  assert.equal(schema.startDate, '2026-12-01');
  assert.equal(schema.endDate, '2026-12-31');
  for (const key of ['location', 'organizer', 'image']) assert.equal(key in schema, false, key);
  assert.equal(seo.image, 'https://yilanpass.com/logo.png');
  assert.doesNotMatch(seo.description, /undefined|null/);
});

test('taipeiDate converts UTC timestamps to the Taiwan calendar day', () => {
  assert.equal(taipeiDate('2026-11-02T00:00:00.000Z'), '2026-11-02');
  assert.equal(taipeiDate('2026-11-01T16:00:00.000Z'), '2026-11-02');
  assert.equal(taipeiDate(null), null);
});

test('formatTaipeiDate is identical on server and browser', async () => {
  const { formatTaipeiDate } = await import('../utils/activity-dates.js');
  assert.equal(formatTaipeiDate('2026-10-24', { weekday: true }), '2026年10月24日 星期六');
  assert.equal(formatTaipeiDate('2026-10-25T16:00:00.000Z', { weekday: true }), '2026年10月26日 星期一');
  assert.equal(formatTaipeiDate('2026-10-17T03:00:00.000Z'), '2026年10月17日');
  assert.equal(formatTaipeiDate(null), '');
});
