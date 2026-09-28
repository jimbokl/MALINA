import test from 'node:test';
import assert from 'node:assert/strict';
import { relatedShopProducts } from '../shop-related.mjs';

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
