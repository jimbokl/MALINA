import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTrellis } from '../assets/trellis-model.mjs';

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
