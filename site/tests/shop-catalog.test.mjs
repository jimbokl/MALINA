import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCatalogManifest } from '../scripts/generate-shop-catalog.mjs';

const header = 'available;categoryId;currencyId;description;id;modified_time;name;picture;price;type;url';
const link = 'https://rzekl.com/g/a?ulp=https%3A%2F%2Fagrosemfond.ru%2Fcatalog%2Fdali';
function row(id, available, category = 'Саженцы земляники/Ранние сорта') {
  return `${available};${category};RUR;Описание;${id};2026-09-28;Земляника садовая Дали;;399;plant;${link}`;
}

test('catalog keeps every relevant SKU and gives duplicate pages one stable canonical', () => {
  const csv = [header, row('101', 'false'), row('102', 'true'), row('103', 'false', 'Декоративные/Цветы')].join('\n');
  const products = buildCatalogManifest(csv);
  assert.equal(products.length, 2);
  assert.deepEqual(products.map(product => product.id), ['101', '102']);
  assert.equal(products[0].slug.endsWith('-101'), true);
  assert.equal(products[1].slug.endsWith('-102'), true);
  assert.equal(products[0].canonicalSlug, products[1].slug);
  assert.equal(products[1].canonicalSlug, products[1].slug);
  assert.equal(products[0].variantLabel, 'Артикул 101');
  assert.equal(products[0].merchantUrl, 'https://agrosemfond.ru/catalog/dali');
});
