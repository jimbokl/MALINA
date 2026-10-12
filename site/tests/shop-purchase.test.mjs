import test from 'node:test';
import assert from 'node:assert/strict';
import { purchaseFacts, sellerSummary } from '../shop-purchase.mjs';

test('calculates per-plant price only when the offer name states an explicit quantity', () => {
  assert.deepEqual(purchaseFacts({ name: 'Малина Гусар 2 саженца', priceMinor: 12500 }), {
    quantityLabel: '2 шт.', materialLabel: null, unitPriceMinor: 6250
  });
  assert.deepEqual(purchaseFacts({ name: 'Клубника Альба 3 растения', priceMinor: 10000 }), {
    quantityLabel: '3 шт.', materialLabel: null, unitPriceMinor: 3333
  });
  assert.deepEqual(purchaseFacts({ name: 'Малина Бальзам 1 шт.', priceMinor: 15840 }), {
    quantityLabel: '1 шт.', materialLabel: null, unitPriceMinor: 15840
  });
});

test('does not infer quantity from cultivar numbers, age, dimensions, or package words in a name', () => {
  for (const name of ['Малина 2 сорта', 'Саженец малины 2-летний', 'Малина высотой 40 см', 'кассетный саженец']) {
    assert.deepEqual(purchaseFacts({ name, priceMinor: 20000 }), {
      quantityLabel: null, materialLabel: null, unitPriceMinor: null
    }, name);
  }
  assert.equal(purchaseFacts({ name: 'Малина 0 шт.', priceMinor: 20000 }).unitPriceMinor, null);
  assert.equal(purchaseFacts({ name: 'Малина 2 шт.', priceMinor: '20000' }).unitPriceMinor, null);
});

test('reads planting material only from explicit offer fields', () => {
  assert.equal(purchaseFacts({ name: 'Малина ЗКС', priceMinor: 20000 }).materialLabel, 'ЗКС');
  assert.equal(purchaseFacts({ name: 'Малина', rootSystem: 'закрытая корневая система' }).materialLabel, 'ЗКС');
  assert.equal(purchaseFacts({ name: 'Клубника', packaging: 'Frigo' }).materialLabel, 'Frigo');
  assert.equal(purchaseFacts({ name: 'Малина', packageType: 'P9' }).materialLabel, 'P9');
  assert.equal(purchaseFacts({ name: 'Клубника', material: 'кассета' }).materialLabel, 'Кассета');
});

test('reads exact material tokens from names and permits a quantity followed immediately by P9', () => {
  assert.deepEqual(purchaseFacts({ name: 'Малина 1 шт.р9', priceMinor: 23000 }), {
    quantityLabel: '1 шт.', materialLabel: 'P9', unitPriceMinor: 23000
  });
  assert.equal(purchaseFacts({ name: 'Клубника (ЗКС)' }).materialLabel, 'ЗКС');
  assert.equal(purchaseFacts({ name: 'Клубника Frigo' }).materialLabel, 'Frigo');
  assert.equal(purchaseFacts({ name: 'Клубника ОКС' }).materialLabel, 'ОКС');
  assert.equal(purchaseFacts({ name: 'Клубника кассета' }).materialLabel, 'Кассета');
  assert.equal(purchaseFacts({ name: 'Клубника frigor' }).materialLabel, null);
  assert.equal(purchaseFacts({ name: 'Клубника кассетная' }).materialLabel, null);
});

test('suppresses quantity and per-plant price for conflicting quantities or seed offers', () => {
  for (const name of ['Малина 1 шт. (3 растения)', 'Семена малины 10 шт.', 'Семян клубники 20 шт.']) {
    assert.deepEqual(purchaseFacts({ name, priceMinor: 5000 }), {
      quantityLabel: null, materialLabel: null, unitPriceMinor: null
    }, name);
  }
});

test('summarizes distinct known sellers from all three Admitad sources', () => {
  assert.deepEqual(sellerSummary([
    { source: 'agrosemfond' }, { source: 'garshinka' }, { source: 'onlinesemena' },
    { source: 'garshinka' }, { source: 'unknown' }, null
  ]), ['Агросемфонд', 'Гаршинка', 'onlinesemena.ru']);
  assert.deepEqual(sellerSummary(null), []);
});
