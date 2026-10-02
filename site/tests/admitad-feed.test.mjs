import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFeedRefresh, buildSnapshot, parseCsv } from '../scripts/admitad-feed.mjs';
import { matchesExpectedName, normalizedShopName } from '../shop-identity.mjs';

const header = 'available;categoryId;currencyId;description;id;modified_time;name;picture;price;type;url';
function row({ id, available = 'true', name = 'Саженец малины Геракл', category = 'Плодовые/Малина/Саженцы', price = '399',
  link = 'https://rzekl.com/g/a?ulp=https%3A%2F%2Fagrosemfond.ru%2Fcatalog%2Fgerakl',
  picture = 'https://agrosemfond.ru/images/gerakl.jpg' }) {
  return `${available};${category};RUR;"Описание; с точкой с запятой";${id};2026-09-28;${name};${picture};${price};plant;${link}`;
}
const approved = id => ({ id, expectedName: 'Геракл', crop: 'raspberry' });
const garshinkaRow = options => row({
  category: 'Плодовые растения/Малина',
  link: 'https://codeaven.com/g/a?ulp=https%3A%2F%2Fwww.garshinka.ru%2Fproduct%2Fgerakl',
  picture: 'https://img.garshinka.ru/gerakl.jpg', ...options
});
const csv = (...rows) => [header, ...rows].join('\n');

test('CSV parser preserves quoted semicolons and embedded newlines', () => {
  const parsed = parseCsv(`${header}\n${row({ id: '101' }).replace('Описание; с', 'Описание;\nс')}\n`);
  assert.equal(parsed[0].id, '101');
  assert.equal(parsed[0].description, 'Описание;\nс точкой с запятой');
});

test('snapshot preserves unavailable products without price or order links', () => {
  const input = [header, row({ id: '101' }), row({ id: '102', available: 'false' }),
    row({ id: '103' }), row({ id: '104', link: 'https://rzekl.com/g/a?ulp=https%3A%2F%2Fevil.example%2F' }),
    row({ id: '105', price: '399,50' })].join('\n');
  const now = new Date('2026-09-28T12:00:00Z');
  const snapshot = buildSnapshot(input, [approved('101'), approved('102'), approved('104'), approved('105')], now);
  assert.deepEqual(snapshot.products.map(product => product.id), ['101', '102', '105']);
  assert.equal(snapshot.products[0].merchantUrl, 'https://agrosemfond.ru/catalog/gerakl');
  assert.equal(snapshot.products[0].affiliateUrl.startsWith('https://rzekl.com/g/'), true);
  assert.equal(snapshot.products[1].availability, 'out_of_stock');
  assert.equal('priceMinor' in snapshot.products[1], false);
  assert.equal('affiliateUrl' in snapshot.products[1], false);
  assert.equal('merchantUrl' in snapshot.products[1], false);
  assert.equal(snapshot.products[2].priceMinor, 39950);
  assert.equal(snapshot.expiresAt, '2026-09-29T00:00:00.000Z');
});

test('duplicate product ID is withdrawn even if both rows look valid', () => {
  const snapshot = buildSnapshot([header, row({ id: '101' }), row({ id: '101' })].join('\n'), [approved('101')]);
  assert.deepEqual(snapshot.products, []);
});

test('reused ID is withdrawn when name or crop category changes', () => {
  const input = [header,
    row({ id: '101', name: 'Саженец малины Пингвин' }),
    row({ id: '102', category: 'Плодовые/Клубника/Саженцы' }),
    row({ id: '103', name: 'Саженец малины Супергеракл' }),
    row({ id: '104', name: 'Саженец малины Геракл', category: 'Плодовые/Малина/Саженцы' })
  ].join('\n');
  const snapshot = buildSnapshot(input, ['101', '102', '103', '104'].map(approved));
  assert.deepEqual(snapshot.products.map(product => product.id), ['104']);
});

test('identity accepts Russian case and ё/е normalization', () => {
  const input = [header, row({ id: '101', name: 'Саженец малины ЁЛКА' })].join('\n');
  const snapshot = buildSnapshot(input, [{ id: '101', expectedName: 'елка', crop: 'raspberry' }]);
  assert.equal(snapshot.products.length, 1);
});

test('second seller snapshot uses its own affiliate, merchant and image hosts', () => {
  const link = 'https://codeaven.com/g/a?ulp=https%3A%2F%2Fwww.garshinka.ru%2Fproduct%2Fgusar';
  const input = [header,
    row({ id: '101', name: 'Малина Гусар', category: 'Плодовые растения/Малина', link,
      picture: 'https://img.garshinka.ru/gusar.jpg' }),
    row({ id: '102', name: 'Малина Гусар', category: 'Плодовые растения/Малина', price: '0', link })
  ].join('\n');
  const snapshot = buildSnapshot(input, [
    { id: 'g-101', expectedName: 'Гусар', crop: 'raspberry' },
    { id: 'g-102', expectedName: 'Гусар', crop: 'raspberry' }
  ], new Date('2026-09-28T12:00:00Z'), 'garshinka');
  assert.deepEqual(snapshot.products.map(product => product.id), ['g-101']);
  assert.equal(snapshot.products[0].source, 'garshinka');
  assert.equal(snapshot.products[0].merchantUrl, 'https://www.garshinka.ru/product/gusar');
  assert.equal(snapshot.products[0].imageUrl, 'https://img.garshinka.ru/gusar.jpg');
});

test('each new feed replaces price and stock without carrying an old order link', () => {
  const now = new Date('2026-09-29T12:00:00Z');
  const first = buildSnapshot([header, row({ id: '101', price: '399' })].join('\n'), [approved('101')], now);
  const changed = buildSnapshot([header, row({ id: '101', price: '449,50' })].join('\n'), [approved('101')], now);
  const unavailable = buildSnapshot([header, row({ id: '101', available: 'false' })].join('\n'), [approved('101')], now);
  const removed = buildSnapshot(header, [approved('101')], now);
  assert.equal(first.products[0].priceMinor, 39900);
  assert.equal(changed.products[0].priceMinor, 44950);
  assert.equal(unavailable.products[0].availability, 'out_of_stock');
  assert.equal('affiliateUrl' in unavailable.products[0], false);
  assert.deepEqual(removed.products, []);
});

test('shared name check accepts normalized cultivar names but rejects substring collisions', () => {
  assert.equal(normalizedShopName('  ЁЛКА\u00a0  ранняя  '), 'елка ранняя');
  assert.equal(matchesExpectedName('Малина «ГЕРАКЛ» 2 шт.', 'геракл'), true);
  for (const name of ['Супергеракл', 'Геракл2', 'Гераклиум']) {
    assert.equal(matchesExpectedName(name, 'Геракл'), false, name);
  }
  assert.equal(matchesExpectedName('Малина Геракл', ''), false);
  assert.equal(matchesExpectedName(null, 'Геракл'), false);
});

test('refresh imports both sellers with independent SKU identities and timestamps', () => {
  const now = new Date('2026-10-02T07:00:00Z');
  const refreshed = buildFeedRefresh([
    { source: 'agrosemfond', csv: csv(row({ id: '101', price: '399' })) },
    { source: 'garshinka', csv: csv(garshinkaRow({ id: '101', price: '449,50' })) }
  ], [], now, []);
  assert.deepEqual(refreshed.snapshot.products.map(product => [product.id, product.source, product.priceMinor]), [
    ['101', 'agrosemfond', 39900], ['g-101', 'garshinka', 44950]
  ]);
  assert.equal(refreshed.snapshot.checkedAt, now.toISOString());
  assert.equal(refreshed.snapshot.expiresAt, '2026-10-02T19:00:00.000Z');
  assert.deepEqual(refreshed.sources.map(source => source.ok), [true, true]);
  assert.equal(new Set(refreshed.catalog.map(product => product.id)).size, 2);
});

test('successive full refresh updates price and stock, adds a new SKU and retains disappeared pages', () => {
  const first = buildFeedRefresh([
    { source: 'agrosemfond', csv: csv(row({ id: '101' }), row({ id: '102' })) },
    { source: 'garshinka', csv: csv(garshinkaRow({ id: '201' })) }
  ], [], new Date('2026-10-02T07:00:00Z'), []);
  const second = buildFeedRefresh([
    { source: 'agrosemfond', csv: csv(row({ id: '101', price: '449,50' }), row({ id: '103', name: 'Малина Атлант' })) },
    { source: 'garshinka', csv: csv(garshinkaRow({ id: '201', available: 'false' })) }
  ], first.catalog, new Date('2026-10-02T13:00:00Z'), []);
  assert.equal(second.snapshot.products.find(product => product.id === '101').priceMinor, 44950);
  const unavailable = second.snapshot.products.find(product => product.id === 'g-201');
  assert.equal(unavailable.availability, 'out_of_stock');
  assert.equal('priceMinor' in unavailable, false);
  assert.equal('affiliateUrl' in unavailable, false);
  assert.equal('merchantUrl' in unavailable, false);
  assert.equal(second.snapshot.products.some(product => product.id === '102'), false);
  const disappeared = second.catalog.find(product => product.id === '102');
  assert.equal(disappeared.slug, first.catalog.find(product => product.id === '102').slug);
  assert.equal(disappeared.merchantUrl, null);
  assert.equal(second.catalog.find(product => product.id === '103').slug, 'tovar-103');
  assert.equal(second.catalog.length, 4);
});

test('malformed CSV of either seller never withdraws a healthy seller', () => {
  for (const brokenSource of ['agrosemfond', 'garshinka']) {
    const feeds = [
      { source: 'agrosemfond', csv: csv(row({ id: '101' })) },
      { source: 'garshinka', csv: csv(garshinkaRow({ id: '201' })) }
    ].map(feed => feed.source === brokenSource ? { ...feed, csv: `${header}\n"unterminated` } : feed);
    const refreshed = buildFeedRefresh(feeds, [], new Date('2026-10-02T07:00:00Z'), []);
    assert.deepEqual(refreshed.snapshot.products.map(product => product.source),
      [brokenSource === 'agrosemfond' ? 'garshinka' : 'agrosemfond']);
    assert.equal(refreshed.sources.find(source => source.source === brokenSource).ok, false);
    assert.notEqual(refreshed.snapshot.checkedAt, null);
  }
});

test('catalog validation error rolls back that seller and preserves other fresh offers and old pages', () => {
  const previous = buildFeedRefresh([
    { source: 'garshinka', csv: csv(garshinkaRow({ id: '201' })) }
  ], [], new Date('2026-10-02T01:00:00Z'), []).catalog;
  const refreshed = buildFeedRefresh([
    { source: 'agrosemfond', csv: csv(row({ id: '101', price: '449,50' })) },
    { source: 'garshinka', csv: csv(garshinkaRow({ id: '202' })) }
  ], previous, new Date('2026-10-02T07:00:00Z'), [
    { id: 'g-202', slug: 'strawberry-original', expectedName: 'Геракл', crop: 'strawberry' }
  ]);
  assert.deepEqual(refreshed.sources.map(source => [source.source, source.ok]), [
    ['agrosemfond', true], ['garshinka', false]
  ]);
  assert.deepEqual(refreshed.snapshot.products.map(product => product.id), ['101']);
  assert.equal(refreshed.snapshot.products[0].priceMinor, 44950);
  assert.equal(refreshed.catalog.some(product => product.id === 'g-202'), false);
  assert.equal(refreshed.catalog.find(product => product.id === 'g-201').slug, previous[0].slug);
  assert.deepEqual(previous.map(product => product.id), ['g-201']);
});

test('no valid sources withdraws every offer without deleting the informational catalog', () => {
  const previous = buildFeedRefresh([
    { source: 'agrosemfond', csv: csv(row({ id: '101' })) }
  ], [], new Date('2026-10-02T01:00:00Z'), []).catalog;
  const refreshed = buildFeedRefresh([
    { source: 'agrosemfond', csv: 'broken' }, { source: 'garshinka', csv: 'broken' }
  ], previous, new Date('2026-10-02T07:00:00Z'), []);
  assert.deepEqual(refreshed.snapshot, { checkedAt: null, expiresAt: null, products: [] });
  assert.deepEqual(refreshed.catalog, previous);
  assert.deepEqual(refreshed.sources.map(source => source.ok), [false, false]);
});
