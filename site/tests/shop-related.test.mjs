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
  assert.deepEqual(outOfStockNextProducts(products[0], products, offerFor, () => null), {
    kind: 'same_cultivar', products: [products[3]]
  });
});

const record = (slug, cropKey, fields = {}) => ({
  slug, cropKey, fruitColor: 'unknown', fruiting: 'unknown', harvestTiming: 'unknown', ...fields
});
const varietyLookup = records => product => records.find(item => item.slug === product.cultivarSlug);
const offerLookup = slugs => product => slugs.includes(product.slug) ? { source: product.source } : null;

test('strawberry alternatives use the published harvest timing, current offers and matching cultivar identity', () => {
  const products = [
    { slug: 'missing', crop: 'strawberry', cultivarSlug: 'aziya' },
    { slug: 'no-offer', crop: 'strawberry', cultivarSlug: 'alba' },
    { slug: 'unverified', crop: 'strawberry', cultivarSlug: null },
    { slug: 'verified', crop: 'strawberry', cultivarSlug: 'alba' },
    { slug: 'wrong-crop', crop: 'raspberry', cultivarSlug: 'gusar' },
    { slug: 'wrong-record', crop: 'strawberry', cultivarSlug: 'gusar' },
    { slug: 'late', crop: 'strawberry', cultivarSlug: 'bereginya' }
  ];
  const varieties = [
    record('aziya', 'strawberry', { harvestTiming: 'early' }),
    record('alba', 'strawberry', { harvestTiming: 'early' }),
    record('gusar', 'raspberry', { harvestTiming: 'early' }),
    record('bereginya', 'strawberry', { harvestTiming: 'late' })
  ];
  const offerFor = offerLookup(['unverified', 'verified', 'wrong-crop', 'wrong-record', 'late']);
  assert.deepEqual(outOfStockNextProducts(products[0], products, offerFor, varietyLookup(varieties)), {
    kind: 'other_cultivars', products: [products[3]]
  });
  assert.deepEqual(outOfStockNextProducts(products[0], products, () => null, varietyLookup(varieties)), {
    kind: 'picker', products: []
  });
});

test('yellow raspberry never falls back to red berries or a conflicting fruiting type', () => {
  const products = ['yellow-current', 'red-summer', 'yellow-remontant', 'yellow-summer'].map(slug => ({
    slug, crop: 'raspberry', cultivarSlug: slug
  }));
  const varieties = [
    record('yellow-current', 'raspberry', { fruitColor: 'yellow', fruiting: 'summer' }),
    record('red-summer', 'raspberry', { fruitColor: 'red', fruiting: 'summer' }),
    record('yellow-remontant', 'raspberry', { fruitColor: 'yellow', fruiting: 'remontant' }),
    record('yellow-summer', 'raspberry', { fruitColor: 'yellow', fruiting: 'summer' })
  ];
  const offerFor = offerLookup(products.slice(1).map(item => item.slug));
  assert.deepEqual(outOfStockNextProducts(products[0], products, offerFor, varietyLookup(varieties)), {
    kind: 'other_cultivars', products: [products[3]]
  });
  assert.deepEqual(outOfStockNextProducts(products[0], products.slice(0, 3), offerFor, varietyLookup(varieties)), {
    kind: 'picker', products: []
  });
});

test('strawberry repeat harvest is not replaced by single-crop strawberries even with matching timing', () => {
  const products = ['current', 'single', 'repeat'].map(slug => ({ slug, crop: 'strawberry', cultivarSlug: slug }));
  const varieties = [
    record('current', 'strawberry', { fruiting: 'remontant', harvestTiming: 'repeat' }),
    record('single', 'strawberry', { fruiting: 'summer', harvestTiming: 'repeat' }),
    record('repeat', 'strawberry', { fruiting: 'remontant', harvestTiming: 'repeat' })
  ];
  assert.deepEqual(outOfStockNextProducts(products[0], products, offerLookup(['single', 'repeat']), varietyLookup(varieties)), {
    kind: 'other_cultivars', products: [products[2]]
  });
});

test('alternatives rank exact confirmed matches first, keep stable ties and show each cultivar once', () => {
  const products = [
    { slug: 'current', crop: 'raspberry', cultivarSlug: 'current' },
    { slug: 'colour-only', crop: 'raspberry', cultivarSlug: 'partial' },
    { slug: 'close-a', crop: 'raspberry', cultivarSlug: 'close-a' },
    { slug: 'full-a', crop: 'raspberry', cultivarSlug: 'full-a' },
    { slug: 'duplicate-a', crop: 'raspberry', cultivarSlug: 'full-a' },
    { slug: 'full-b', crop: 'raspberry', cultivarSlug: 'full-b' }
  ];
  const full = { fruitColor: 'red', fruiting: 'summer', harvestTiming: 'middle' };
  const varieties = [
    record('current', 'raspberry', full),
    record('partial', 'raspberry', { fruitColor: 'red' }),
    record('close-a', 'raspberry', { ...full, harvestTiming: 'early' }),
    record('full-a', 'raspberry', full),
    record('full-b', 'raspberry', full)
  ];
  const offerFor = offerLookup(products.slice(1).map(item => item.slug));
  const lookup = varietyLookup(varieties);
  for (let repeat = 0; repeat < 2; repeat += 1) {
    assert.deepEqual(outOfStockNextProducts(products[0], products, offerFor, lookup), {
      kind: 'other_cultivars', products: [products[3], products[5], products[2]]
    });
  }
  assert.deepEqual(outOfStockNextProducts(products[0], products, offerFor, lookup, 2).products, [products[3], products[5]]);
});

for (const crop of ['raspberry', 'strawberry']) {
  test(`${crop}: missing or unknown comparable traits lead to the picker without guessing from names`, () => {
    const products = [
      { slug: 'current', crop, cultivarSlug: 'current', name: 'Жёлтая ремонтантная ранняя', categoryId: 'early' },
      { slug: 'candidate', crop, cultivarSlug: 'candidate', name: 'Жёлтая ремонтантная ранняя', categoryId: 'early' }
    ];
    const varieties = [
      record('current', crop, { name: 'Жёлтая ремонтантная ранняя', season: 'summer', fruitingLabel: 'Летний сорт' }),
      record('candidate', crop, { name: 'Жёлтая ремонтантная ранняя', season: 'summer', traits: ['Жёлтые ягоды'] })
    ];
    const offerFor = offerLookup(['candidate']);
    assert.deepEqual(outOfStockNextProducts(products[0], products, offerFor, varietyLookup(varieties)), { kind: 'picker', products: [] });
    varieties[0].fruitColor = 'yellow';
    varieties[0].fruiting = 'summer';
    varieties[0].harvestTiming = 'early';
    assert.deepEqual(outOfStockNextProducts(products[0], products, offerFor, varietyLookup(varieties)), { kind: 'picker', products: [] });
    varieties[1].fruitColor = '';
    varieties[1].fruiting = undefined;
    varieties[1].harvestTiming = null;
    assert.deepEqual(outOfStockNextProducts(products[0], products, offerFor, varietyLookup(varieties)), { kind: 'picker', products: [] });
  });
}

test('alternatives require published records for both the current and suggested cultivar', () => {
  const products = [
    { slug: 'current', crop: 'raspberry', cultivarSlug: 'current' },
    { slug: 'candidate', crop: 'raspberry', cultivarSlug: 'candidate' }
  ];
  const offerFor = offerLookup(['candidate']);
  const current = record('current', 'raspberry', { fruitColor: 'red' });
  const candidate = record('candidate', 'raspberry', { fruitColor: 'red' });
  for (const records of [[], [current], [candidate], [current, { ...candidate, slug: 'different' }]]) {
    assert.deepEqual(outOfStockNextProducts(products[0], products, offerFor, varietyLookup(records)), { kind: 'picker', products: [] });
  }
  const missingLink = { ...products[0], cultivarSlug: null };
  assert.deepEqual(outOfStockNextProducts(missingLink, products, offerFor, () => null), { kind: 'picker', products: [] });
  assert.deepEqual(outOfStockNextProducts(products[0], products, offerFor, () => true), { kind: 'picker', products: [] });
});
