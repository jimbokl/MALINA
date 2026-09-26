import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTrellis, calculateTrellisCost } from '../assets/trellis-model.mjs';

test('считает концевые и промежуточные опоры на каждом ряду', () => {
  assert.deepEqual(calculateTrellis({ length: 25, rows: 2, maxSpan: 10, wireLines: 2 }), {
    rows: 2, spansPerRow: 3, endPosts: 4, intermediatePosts: 4,
    totalPosts: 8, wireLines: 2, wireLength: 100, actualSpan: 25 / 3
  });
});

test('короткий ряд всё равно имеет две концевые опоры', () => {
  const result = calculateTrellis({ length: 2, rows: 1, maxSpan: 10, wireLines: 1 });
  assert.equal(result.totalPosts, 2);
  assert.equal(result.intermediatePosts, 0);
});

test('не принимает дробное число рядов, пустой и отрицательный шаг', () => {
  const input = { length: 20, rows: 1, maxSpan: 10, wireLines: 2 };
  assert.throws(() => calculateTrellis({ ...input, rows: 1.5 }), RangeError);
  assert.throws(() => calculateTrellis({ ...input, maxSpan: '' }), RangeError);
  assert.throws(() => calculateTrellis({ ...input, length: -1 }), RangeError);
  assert.throws(() => calculateTrellis({ ...input, length: 10000, rows: 1000, maxSpan: 0.01 }), /Слишком много опор/);
});

test('смета использует отдельно цены разных опор и округляет до копейки', () => {
  const materials = calculateTrellis({ length: 2.5, rows: 2, maxSpan: 2, wireLines: 3 });
  assert.deepEqual(calculateTrellisCost(materials, {
    endPostPrice: '349.90', intermediatePostPrice: '129,29', wirePrice: '12.34'
  }), { endPosts: 1399.6, intermediatePosts: 258.58, wire: 185.1, total: 1843.28 });
});

test('не подменяет отсутствующую цену нулём и не принимает дробные копейки', () => {
  const materials = calculateTrellis({ length: 10, rows: 1, maxSpan: 5, wireLines: 2 });
  assert.throws(() => calculateTrellisCost(materials, { endPostPrice: '100', intermediatePostPrice: '', wirePrice: '5' }), /укажите цену/);
  assert.throws(() => calculateTrellisCost(materials, { endPostPrice: '100', intermediatePostPrice: '200', wirePrice: '5.999' }), /точностью до копейки/);
  assert.throws(() => calculateTrellisCost(materials, { endPostPrice: '-1', intermediatePostPrice: '200', wirePrice: '5' }), RangeError);
});
