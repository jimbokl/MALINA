import test from 'node:test';
import assert from 'node:assert/strict';
import { varieties } from '../data.mjs';
import { matchShopCultivar, shopProducts } from '../shop-products.mjs';

const raspberry = name => ({ name, crop: 'raspberry', categoryId: 'Плодовые/Малина/Обыкновенная' });
const strawberry = name => ({ name, crop: 'strawberry', categoryId: 'Саженцы земляники/Средние сорта' });

test('shop cultivar identity requires the whole verified name in the correct crop', () => {
  assert.equal(matchShopCultivar(raspberry('Малина Метеор 1 шт')), 'meteor');
  assert.equal(matchShopCultivar(strawberry('Земляника садовая Кимберли 1 шт.р9')), 'kimberli');
  assert.equal(matchShopCultivar(strawberry('Земляника садовая Вима Кимберли 1 шт.р9')), 'kimberli');
  assert.equal(matchShopCultivar(raspberry('Малина Желтый гигант')), 'zheltyy-gigant');
  assert.equal(matchShopCultivar(strawberry('Земляника садовая Элан F1')), null);
  assert.equal(matchShopCultivar(strawberry('Набор Азия и Клери 3 саженца')), null);
  assert.equal(matchShopCultivar(raspberry('Малина ремонтантная штамбовая (малиновое дерево) Таруса')), null);
  assert.equal(matchShopCultivar(raspberry('Малина ремонтантная Гусар')), null);
  assert.equal(matchShopCultivar(raspberry('Малина ремонтантная Золотая осень')), null);
  assert.equal(matchShopCultivar(raspberry('Малина Джоан Джи')), null);
  assert.equal(matchShopCultivar({ ...raspberry('Малина Метеор'), crop: 'strawberry' }), null);
});

test('linked shop SKUs use published cultivar identities and retain editorial sources', () => {
  const verified = new Map(varieties.map(variety => [variety.slug, variety]));
  const curatedIds = new Set(['67762', '71131', '71157', '71544', '68612', '68587']);
  const linked = shopProducts.filter(product => product.cultivarSlug);
  assert.equal(linked.length, 77);
  assert.equal(new Set(linked.map(product => product.cultivarSlug)).size, 32);
  for (const product of linked) {
    const variety = verified.get(product.cultivarSlug);
    assert.ok(variety, `unknown cultivar: ${product.id}`);
    assert.equal(variety.cropKey, product.crop, `wrong crop: ${product.id}`);
    assert.ok(product.sources.length, `missing sources: ${product.id}`);
    if (!curatedIds.has(product.id)) {
      assert.ok(product.sources.some(source => source.url === variety.source), `missing cultivar source: ${product.id}`);
    }
  }
  for (const [id, slug] of Object.entries({
    67762: 'gusar', 71131: 'gerakl', 71157: 'rubinovoe-ozherele',
    71544: 'zheltyy-gigant', 68612: 'aziya', 68587: 'kleri'
  })) {
    assert.equal(shopProducts.find(product => product.id === id)?.cultivarSlug, slug);
  }
  assert.equal(shopProducts.find(product => product.id === '67833')?.cultivarSlug, null);
});
