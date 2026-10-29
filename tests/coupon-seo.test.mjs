import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCouponSeo } from '../utils/coupon-seo.js';
import { serializeJsonLd } from '../utils/homestay-seo.js';

test('coupon metadata describes the shop and its offer, not a product', () => {
  const seo = buildCouponSeo({
    id: 194, title: '沐吉手作工坊', content: '1. 手作課程享 9 折\n2. 不得與其他優惠併用',
    cover: ['https://yilanpass.com/shop/a.jpg'], township: ['羅東鎮'], adress: ['宜蘭縣羅東鎮中正路 1 號']
  });
  assert.equal(seo.url, 'https://yilanpass.com/articles/194');
  assert.equal(seo.title, '沐吉手作工坊｜宜蘭優惠券｜宜蘭旅遊通');
  assert.match(seo.description, /^沐吉手作工坊（宜蘭羅東鎮）優惠：手作課程享 9 折/);
  assert.equal(seo.schema['@type'], 'LocalBusiness');
  assert.equal(seo.schema.address.streetAddress, '宜蘭縣羅東鎮中正路 1 號');
  assert.equal(seo.schema.makesOffer['@type'], 'Offer');
  const json = serializeJsonLd(seo.schema);
  for (const forbidden of ['Product', 'price', 'shippingDetails', 'MerchantReturnPolicy', 'Brand']) {
    assert.equal(json.includes(forbidden), false, forbidden);
  }
});

test('missing address and images are omitted', () => {
  const seo = buildCouponSeo({ id: 1, title: '租車', content: '' });
  const schema = JSON.parse(serializeJsonLd(seo.schema));
  assert.equal('address' in schema, false);
  assert.equal('image' in schema, false);
  assert.equal(seo.image, 'https://yilanpass.com/logo.png');
  assert.doesNotMatch(seo.description, /undefined|null/);
});
