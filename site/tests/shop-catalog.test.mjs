import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCatalogManifest, shopNameKey } from '../scripts/generate-shop-catalog.mjs';
import { buildSnapshot } from '../scripts/admitad-feed.mjs';

const header = 'available;categoryId;currencyId;description;id;modified_time;name;picture;price;type;url';
const link = 'https://rzekl.com/g/a?ulp=https%3A%2F%2Fagrosemfond.ru%2Fcatalog%2Fdali';
function row(id, available, category = 'Саженцы земляники/Ранние сорта', name = 'Земляника садовая Дали', url = link) {
  return `${available};${category};RUR;Описание;${id};2026-09-28;${name};;399;plant;${url}`;
}

test('catalog keeps every relevant SKU and gives one stable page to duplicate offers', () => {
  const csv = [header, row('101', 'false'), row('102', 'true'), row('103', 'false', 'Декоративные/Цветы')].join('\n');
  const products = buildCatalogManifest(csv);
  assert.equal(products.length, 2);
  assert.deepEqual(products.map(product => product.id), ['101', '102']);
  assert.equal(products[0].slug.endsWith('-101'), true);
  assert.equal(products[1].slug.endsWith('-102'), true);
  assert.equal(products[0].canonicalSlug, products[0].slug);
  assert.equal(products[1].canonicalSlug, products[0].slug);
  assert.equal(products[0].variantLabel, 'Артикул 101');
  assert.equal(products[0].merchantUrl, 'https://agrosemfond.ru/catalog/dali');
});

test('package and pot suffixes collapse into one page while offers remain separate', () => {
  const otherLink = link.replace('dali', 'dali_1_sht_r9');
  const csv = [header,
    row('101', 'false'),
    row('102', 'true', 'Саженцы земляники/Ранние сорта', 'Земляника садовая Дали 1 шт.р9', otherLink)
  ].join('\n');
  const first = buildCatalogManifest(csv);
  assert.equal(first.length, 2);
  assert.equal(first[1].canonicalSlug, first[0].slug);
  assert.equal(shopNameKey(first[1].name), shopNameKey(first[0].name));
  const reversedStock = csv.replace('false;', 'true;').replace('true;Саженцы земляники/Ранние сорта;RUR;Описание;102', 'false;Саженцы земляники/Ранние сорта;RUR;Описание;102');
  const refreshed = buildCatalogManifest(reversedStock, [], first);
  assert.equal(refreshed[0].canonicalSlug, first[0].slug);
  assert.equal(refreshed[1].canonicalSlug, first[0].slug);
});

test('verified Кимберли alias shares one page with the cultivar name', () => {
  const csv = [header,
    row('101', 'false', 'Саженцы земляники/Ранние сорта', 'Земляника садовая Вима Кимберли 1 шт.р9'),
    row('102', 'true', 'Саженцы земляники/Ранние сорта', 'Земляника садовая Кимберли')
  ].join('\n');
  const products = buildCatalogManifest(csv);
  assert.equal(products[0].canonicalSlug, products[1].canonicalSlug);
  assert.equal(shopNameKey(products[0].name), shopNameKey(products[1].name));
});

test('ASF stock label does not create a second cultivar page', () => {
  const csv = [header,
    row('101', 'false', 'Саженцы земляники/Ремонтантные сорта', 'Земляника Фреска 1шт р9'),
    row('102', 'true', 'Саженцы земляники/Ремонтантные сорта', 'Земляника Фреска ASF 1 шт р9')
  ].join('\n');
  const products = buildCatalogManifest(csv);
  assert.equal(products[0].canonicalSlug, products[1].canonicalSlug);
  assert.equal(shopNameKey(products[0].name), 'клубника фреска');
});

test('pack and ASF suffixes collapse in either order', () => {
  assert.equal(shopNameKey('Земляника Фреска ASF 1 шт р9'), shopNameKey('Земляника Фреска 1 шт р9 ASF'));
  assert.equal(shopNameKey('Земляника Фреска 1 шт р9 ASF'), 'клубника фреска');
  assert.equal(shopNameKey('Малина Жёлтый гигант'), shopNameKey('Малина Желтый гигант'));
});

test('second seller adds offers to a shared plant page and keeps new products distinct', () => {
  const old = buildCatalogManifest([header, row('101', 'true', 'Плодовые/Малина/Обыкновенная', 'Малина Гусар')].join('\n'));
  const garshinkaLink = 'https://codeaven.com/g/a?ulp=https%3A%2F%2Fwww.garshinka.ru%2Fproduct%2Fgusar';
  const second = [header,
    row('101', 'true', 'Плодовые растения/Малина', 'Малина Гусар красная', garshinkaLink),
    row('102', 'true', 'Плодовые растения/Клубника и земляника', 'Клубника Аврора', garshinkaLink),
    row('103', 'true', 'Плодовые растения/Клубника и земляника', 'Земклуника Находка', garshinkaLink),
    row('104', 'true', 'Плодовые растения/Малина', 'Малина-клен душистая', garshinkaLink)
  ].join('\n');
  const combined = buildCatalogManifest(second, [], old, { source: 'garshinka', stableNewSlugs: true });
  assert.equal(combined.length, 3);
  assert.equal(combined.find(product => product.id === 'g-101').canonicalSlug, old[0].slug);
  assert.equal(combined.find(product => product.id === 'g-102').canonicalSlug, 'tovar-g-102');
  assert.equal(combined.find(product => product.id === 'g-101').source, 'garshinka');
});

test('the duplicate Изобильная category label shares the existing page', () => {
  const csv = [header,
    row('101', 'false', 'Плодовые/Малина/Обыкновенная', 'Малина Изобильная'),
    row('102', 'true', 'Плодовые/Малина/Ремонтантная', 'Малина ремонтантная Изобильная 1 шт')
  ].join('\n');
  const products = buildCatalogManifest(csv);
  assert.equal(products[0].canonicalSlug, products[1].canonicalSlug);
  assert.equal(shopNameKey(products[0].name), 'малина изобильная');
});

test('refresh adds new products, merges new pack variants, and retains missing pages without offers', () => {
  const initial = buildCatalogManifest([header,
    row('101', 'true'),
    row('102', 'false', 'Саженцы земляники/Ранние сорта', 'Земляника садовая Дали 1 шт.р9')
  ].join('\n'));
  const refreshedFeed = [header,
    row('102', 'true', 'Саженцы земляники/Ранние сорта', 'Земляника садовая Дали 1 шт.р9'),
    row('103', 'false', 'Саженцы земляники/Ранние сорта', 'Земляника садовая Дали ASF'),
    row('104', 'true', 'Плодовые/Малина/Обыкновенная', 'Малина Новинка')
  ].join('\n');
  const refreshed = buildCatalogManifest(refreshedFeed, [], initial, { stableNewSlugs: true });
  assert.equal(refreshed.length, 4);
  assert.equal(refreshed.filter(product => product.canonicalSlug === product.slug).length, 2);
  assert.equal(refreshed.find(product => product.id === '102').canonicalSlug, initial.find(product => product.id === '101').slug);
  assert.equal(refreshed.find(product => product.id === '103').canonicalSlug, initial.find(product => product.id === '101').slug);
  assert.equal(refreshed.find(product => product.id === '104').slug, 'tovar-104');
  assert.equal(refreshed.find(product => product.id === '101').merchantUrl, null);
  const snapshot = buildSnapshot(refreshedFeed, refreshed);
  assert.deepEqual(snapshot.products.map(product => product.id).sort(), ['102', '103', '104']);
});

test('seller reuse of an ID cannot replace an existing product page or activate its offer', () => {
  const original = buildCatalogManifest([header, row('101', 'true')].join('\n'));
  const changedFeed = [header, row('101', 'true', 'Саженцы земляники/Ранние сорта', 'Земляника садовая Другой сорт')].join('\n');
  const refreshed = buildCatalogManifest(changedFeed, [], original, { stableNewSlugs: true });
  assert.equal(refreshed.length, 1);
  assert.equal(refreshed[0].slug, original[0].slug);
  assert.equal(refreshed[0].name, original[0].name);
  assert.equal(refreshed[0].merchantUrl, null);
  assert.deepEqual(buildSnapshot(changedFeed, refreshed).products, []);
});

test('bad offer links and repeated IDs do not block unrelated catalog updates', () => {
  const initial = buildCatalogManifest([header, row('101', 'true')].join('\n'));
  const csv = [header,
    row('101', 'true'),
    row('101', 'true', 'Саженцы земляники/Ранние сорта', 'Земляника садовая Чужой сорт'),
    row('102', 'true', 'Плодовые/Малина/Обыкновенная', 'Малина Новинка', 'https://example.com/not-an-offer'),
    row('103', 'true', 'Плодовые/Малина/Обыкновенная', 'Малина Надёжная')
  ].join('\n');
  const refreshed = buildCatalogManifest(csv, [], initial, { stableNewSlugs: true });
  assert.equal(refreshed.length, 3);
  assert.equal(refreshed.find(product => product.id === '101').name, initial[0].name);
  assert.equal(refreshed.find(product => product.id === '102').merchantUrl, null);
  assert.equal(refreshed.find(product => product.id === '103').slug, 'tovar-103');
  assert.deepEqual(buildSnapshot(csv, refreshed).products.map(product => product.id), ['103']);
});
