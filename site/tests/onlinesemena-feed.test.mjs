import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFeedRefresh, buildSnapshot, cacheImages } from '../scripts/admitad-feed.mjs';
import { buildCatalogManifest } from '../scripts/generate-shop-catalog.mjs';
import { currentShopOffers } from '../shop-model.mjs';
import { matchShopCultivar } from '../shop-products.mjs';
import { mkdtemp, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The new feed has RUB, count, and no description column.
const columns = ['available', 'categoryId', 'count', 'currencyId', 'id', 'name', 'picture', 'price', 'url'];
const raspberry = 'Каталог/Саженцы Питомник/Плодовые деревья и кустарники/Малина/Красная малина';
const strawberry = 'Каталог/Саженцы клубники и земляники/Ранняя земляника (клубника)';
const now = new Date('2026-10-12T10:00:00Z');
const merchant = 'https://onlinesemena.ru/catalog/gusar/';
const affiliate = `https://dkfrh.com/g/test/?ulp=${encodeURIComponent(merchant)}`;
function row(change = {}) {
  const values = { available: 'true', categoryId: raspberry, count: '12', currencyId: 'RUB', id: '101',
    name: 'Малина Гусар', picture: 'https://onlinesemena.ru/upload/gusar.jpg', price: '158.40', url: affiliate, ...change };
  return columns.map(key => `"${String(values[key]).replaceAll('"', '""')}"`).join(';');
}
const csv = (...rows) => [columns.join(';'), ...rows].join('\n');
const manifest = input => buildCatalogManifest(input, [], [], { source: 'onlinesemena', stableNewSlugs: true });

test('third feed publishes validated RUB offers, namespaced IDs and cached product images', () => {
  const input = csv(row());
  const products = manifest(input);
  const snapshot = buildSnapshot(input, products, now, 'onlinesemena');
  assert.equal(products[0].id, 'o-101');
  assert.equal(products[0].description, '');
  assert.equal(snapshot.products[0].priceMinor, 15840);
  assert.equal(snapshot.products[0].merchantUrl, merchant);
  const offer = { ...snapshot.products[0], imagePath: '/assets/shop/o-101.jpg' };
  assert.equal(currentShopOffers({ ...snapshot, products: [offer] }, products, now).get('o-101').imagePath, offer.imagePath);
  assert.equal(currentShopOffers(snapshot, products, new Date('2026-10-12T22:00:00Z')).size, 0);
  assert.equal(matchShopCultivar(products[0]), 'gusar');
});

test('new source rejects other currencies, merchants, affiliate hosts and duplicate IDs', () => {
  for (const change of [
    { currencyId: 'USD' }, { currencyId: 'RUR' }, { price: '0' }, { url: affiliate.replace('dkfrh.com', 'codeaven.com') },
    { url: `https://dkfrh.com/g/test/?ulp=${encodeURIComponent('https://evil.example/item/')}` },
    { url: `https://dkfrh.com/g/test/?ulp=${encodeURIComponent('https://user:pass@onlinesemena.ru/item/')}` }
  ]) {
    const input = csv(row(change));
    assert.equal(buildSnapshot(input, manifest(input), now, 'onlinesemena').products.length, 0);
  }
  const duplicate = csv(row(), row({ price: '200' }));
  assert.equal(buildSnapshot(duplicate, [{ id: 'o-101', crop: 'raspberry', expectedName: 'Гусар' }], now, 'onlinesemena').products.length, 0);
});

test('only matching seedling categories enter the berry catalog', () => {
  const input = csv(row(), row({ id: '102', categoryId: strawberry, name: 'Земляника садовая Клери (3 шт)' }),
    row({ id: '103', categoryId: strawberry, name: 'Земклуника Раиса (3 шт)' }),
    row({ id: '104', name: 'Малино-поляничный гибрид (малина х поляника)' }),
    row({ id: '105', categoryId: 'Каталог/Семена овощей/Земляника', name: 'Земляника Руяна' }),
    row({ id: '106', categoryId: 'Каталог/Сопутствующие товары/Удобрения', name: 'Удобрение для малины' }),
    row({ id: '107', categoryId: 'Каталог/Саженцы Питомник/Плодовые деревья и кустарники/Ежемалина (малина х ежевика)' }));
  assert.deepEqual(manifest(input).map(product => product.id), ['o-101', 'o-102']);
});

test('pack variants share the existing cultivar URL without merging distinct cultivar names', () => {
  const old = [{ id: '68587', source: 'agrosemfond', slug: 'kleri-sazhenec', canonicalSlug: 'kleri-sazhenec',
    crop: 'strawberry', name: 'Земляника садовая Клери', expectedName: 'Клери' }];
  const input = csv(row({ id: '101', categoryId: strawberry, name: 'Земляника садовая Клери (3 шт)' }),
    row({ id: '102', categoryId: strawberry, name: 'Земляника садовая Клери (5 шт)' }),
    row({ id: '103', categoryId: strawberry, name: 'Земляника садовая Суперклери (3 шт)' }));
  const products = buildCatalogManifest(input, [], old, { source: 'onlinesemena', stableNewSlugs: true });
  assert.equal(products.find(product => product.id === 'o-101').canonicalSlug, 'kleri-sazhenec');
  assert.equal(products.find(product => product.id === 'o-102').canonicalSlug, 'kleri-sazhenec');
  assert.equal(products.find(product => product.id === 'o-103').canonicalSlug, 'tovar-o-103');
  assert.equal(matchShopCultivar(products.find(product => product.id === 'o-101')), 'kleri');
});

test('refresh isolates a broken third source and withdraws vanished or unavailable offers', () => {
  const good = csv(row());
  const first = buildFeedRefresh([{ source: 'onlinesemena', csv: good }], [], now, []);
  const missing = buildFeedRefresh([{ source: 'onlinesemena', csv: csv() }], first.catalog, now, []);
  assert.equal(missing.catalog.length, 1);
  assert.equal(missing.snapshot.products.length, 0);
  const unavailable = buildFeedRefresh([{ source: 'onlinesemena', csv: csv(row({ available: 'false' })) }], first.catalog, now, []);
  assert.equal(unavailable.snapshot.products[0].availability, 'out_of_stock');
  assert.equal('priceMinor' in unavailable.snapshot.products[0], false);
  assert.equal('affiliateUrl' in unavailable.snapshot.products[0], false);
  const agro = csv(row({ categoryId: 'Плодовые/Малина/Обыкновенная', currencyId: 'RUR',
    url: `https://rzekl.com/g/test/?ulp=${encodeURIComponent('https://agrosemfond.ru/catalog/gusar/')}` }));
  const garshinka = csv(row({ categoryId: 'Плодовые растения/Малина', currencyId: 'RUR',
    url: `https://codeaven.com/g/test/?ulp=${encodeURIComponent('https://www.garshinka.ru/product/gusar/')}` }));
  const feeds = [{ source: 'agrosemfond', csv: agro }, { source: 'garshinka', csv: garshinka }, { source: 'onlinesemena', csv: good }];
  const all = buildFeedRefresh(feeds, [], now, []);
  assert.deepEqual(all.snapshot.products.map(product => product.id), ['101', 'g-101', 'o-101']);
  for (const source of feeds.map(feed => feed.source)) {
    const refreshed = buildFeedRefresh(feeds.map(feed => feed.source === source ? { ...feed, csv: 'broken' } : feed), all.catalog, now, []);
    assert.equal(refreshed.sources.find(result => result.source === source).ok, false);
    assert.deepEqual(refreshed.snapshot.products.map(product => product.source).sort(), feeds.map(feed => feed.source).filter(id => id !== source).sort());
    assert.equal(refreshed.catalog.length, 3);
  }
});

test('third seller image cache removes vanished files while retaining unrelated assets', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'malina-feed-images-'));
  try {
    await writeFile(join(directory, 'o-101.jpg'), 'old');
    await writeFile(join(directory, 'notes.txt'), 'keep');
    await cacheImages([], directory);
    assert.deepEqual(await readdir(directory), ['notes.txt']);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
