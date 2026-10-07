import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHomestaySeo, serializeJsonLd, parseListPage } from '../utils/homestay-seo.js';

test('metadata preserves leading-zero IDs and actual contact, price and pet fields', () => {
  const seo = buildHomestaySeo({
    id: '070', name: '測試民宿', area: '冬山鄉', description: '庭院住宿',
    image_urls: ['/photo.jpg'], contact: { phone: '039500000', website: 'https://example.com' },
    prices: { fullRentWeekday: 'NT$ 8,000', fullRentWeekend: 'NT$ 20,000' },
    features: { serviceAmenities: ['可帶寵物入住'] }
  });
  assert.equal(seo.url, 'https://yilanpass.com/homestays/070');
  assert.equal(seo.schema.telephone, '039500000');
  assert.deepEqual(seo.schema.sameAs, ['https://example.com/']);
  assert.equal(seo.image, 'https://yilanpass.com/photo.jpg');
  assert.equal(seo.schema.petsAllowed, true);
  assert.equal(seo.schema.priceRange, 'NT$ 8,000 / NT$ 20,000');
  assert.match(seo.title, /冬山鄉/);
});

test('missing facts are omitted instead of fabricating commercial claims', () => {
  const seo = buildHomestaySeo({ id: '1', name: '民宿' });
  const schema = JSON.parse(serializeJsonLd(seo.schema));
  for (const key of ['priceRange', 'petsAllowed', 'paymentAccepted', 'checkinTime', 'checkoutTime', 'aggregateRating', 'sameAs', 'telephone', 'image']) {
    assert.equal(key in schema, false, key);
  }
  assert.doesNotMatch(seo.description, /undefined|KTV|戲水池/);
});

test('JSON-LD cannot close its script element, while retaining original text', () => {
  const text = '</script><script>alert(1)</script>';
  const encoded = serializeJsonLd({ description: text });
  assert.equal(encoded.includes('<'), false);
  assert.equal(JSON.parse(encoded).description, text);
});

test('pagination accepts positive integer pages only', () => {
  assert.equal(parseListPage(undefined), 1);
  assert.equal(parseListPage('2'), 2);
  for (const value of ['0', '-1', '1.5', 'abc', 'Infinity', '9007199254740992', '', '2e0', ['2']]) {
    assert.equal(parseListPage(value), null, value);
  }
});
