import test from 'node:test';
import assert from 'node:assert/strict';
import { relatedShopProducts, outOfStockNextProducts } from '../shop-related.mjs';

test('related products show available offers of the same crop and prefer the same category', () => {
  const products = [
    { slug: 'a', crop: 'raspberry', categoryId: 'ordinary' },
    { slug: 'b', crop: 'raspberry', categoryId: 'remontant' },
    { slug: 'c', crop: 'strawberry', categoryId: 'early' },
    { slug: 'd', crop: 'raspberry', categoryId: 'ordinary' },
    { slug: 'e', crop: 'raspberry', categoryId: 'ordinary' },
    { slug: 'f', crop: 'raspberry', categoryId: 'remontant' }
  ];
  const available = new Set(['b', 'd', 'f']);
  const offerFor = product => available.has(product.slug);
  const related = relatedShopProducts(products[0], products, offerFor);
  assert.deepEqual(related.map(product => product.slug), ['d', 'b', 'f']);
  assert.ok(related.every(product => product.crop === 'raspberry'));
});

test('related products rotate with the current page instead of repeating the first three', () => {
  const products = ['a', 'b', 'c', 'd', 'e'].map(slug => ({ slug, crop: 'strawberry', categoryId: 'early' }));
  const offerFor = () => true;
  assert.deepEqual(relatedShopProducts(products[0], products, offerFor).map(product => product.slug), ['b', 'c', 'd']);
  assert.deepEqual(relatedShopProducts(products[2], products, offerFor).map(product => product.slug), ['d', 'e', 'a']);
});

test('out of stock path prefers another available offer of the same cultivar', () => {
  const products = [
    { slug: 'missing', crop: 'raspberry', cultivarSlug: 'gusar', source: 'seller-a' },
    { slug: 'other-crop', crop: 'strawberry', cultivarSlug: 'gusar' },
    { slug: 'same-seller', crop: 'raspberry', cultivarSlug: 'gusar', source: 'seller-a' },
    { slug: 'same-cultivar', crop: 'raspberry', cultivarSlug: 'gusar', source: 'seller-b' },
    { slug: 'other-cultivar', crop: 'raspberry', cultivarSlug: 'gerakl' }
  ];
  const offerFor = item => item.slug !== 'missing' ? { source: item.source } : null;
  assert.deepEqual(outOfStockNextProducts(products[0], products, offerFor, () => true), {
    kind: 'same_cultivar', products: [products[3], products[2]]
  });
});

test('out of stock path uses available catalogued cultivars only, then picker', () => {
  const products = [
    { slug: 'missing', crop: 'strawberry', cultivarSlug: 'aziya' },
    { slug: 'no-offer', crop: 'strawberry', cultivarSlug: 'alba' },
    { slug: 'unverified', crop: 'strawberry', cultivarSlug: null },
    { slug: 'verified', crop: 'strawberry', cultivarSlug: 'alba' },
    { slug: 'wrong-crop', crop: 'raspberry', cultivarSlug: 'gusar' }
  ];
  const offerFor = item => item.slug !== 'missing' && item.slug !== 'no-offer';
  const isVerified = item => item.slug === 'verified';
  assert.deepEqual(outOfStockNextProducts(products[0], products, offerFor, isVerified), {
    kind: 'other_cultivars', products: [products[3]]
  });
  assert.deepEqual(outOfStockNextProducts(products[0], products, () => null, isVerified), {
    kind: 'picker', products: []
  });
});
