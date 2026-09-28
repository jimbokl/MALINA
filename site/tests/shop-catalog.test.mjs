import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCatalogManifest, shopNameKey } from '../scripts/generate-shop-catalog.mjs';

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
