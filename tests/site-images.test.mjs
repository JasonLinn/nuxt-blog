import test from 'node:test';
import assert from 'node:assert/strict';
import { createSiteImageRewriter } from '../utils/site-images.js';

const { rewrite, rewriteRow } = createSiteImageRewriter([
  'shop/1763963070263-IMG_2692 - 黃翊菱.jpeg',
  'yilan-activities/a.jpg'
]);

test('deployed GitHub uploads are served from the site domain', () => {
  assert.equal(
    rewrite('https://raw.githubusercontent.com/JasonLinn/nuxt-blog/main/public/shop/1763963070263-IMG_2692%20-%20%E9%BB%83%E7%BF%8A%E8%8F%B1.jpeg'),
    'https://yilanpass.com/shop/1763963070263-IMG_2692%20-%20%E9%BB%83%E7%BF%8A%E8%8F%B1.jpeg'
  );
});

test('images not in this build and other hosts are left unchanged', () => {
  const pending = 'https://raw.githubusercontent.com/JasonLinn/nuxt-blog/main/public/shop/new.jpg';
  assert.equal(rewrite(pending), pending);
  assert.equal(rewrite('https://yilanpass.com/shop/a.jpg'), 'https://yilanpass.com/shop/a.jpg');
  assert.equal(rewrite('https://raw.githubusercontent.com/x/y/main/public/%E0%A4%A'), 'https://raw.githubusercontent.com/x/y/main/public/%E0%A4%A');
  assert.equal(rewrite(null), null);
});

test('rows keep other fields and rewrite cover arrays and image strings', () => {
  const row = { id: 1, title: 't', cover: ['https://raw.githubusercontent.com/a/b/main/public/yilan-activities/a.jpg'], images: 'x' };
  const next = rewriteRow(row);
  assert.deepEqual(next, { id: 1, title: 't', cover: ['https://yilanpass.com/yilan-activities/a.jpg'], images: 'x' });
  assert.notEqual(next, row);
});
