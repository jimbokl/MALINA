import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePlanting } from '../assets/planting-model.mjs';

test('считает полные интервалы и несколько грядок без округления саженцев вверх', () => {
  assert.deepEqual(calculatePlanting({ length: '10', width: '1', beds: '2', rowSpacing: '50', plantSpacing: '30' }), {
    rows: 2, plantsPerRow: 33, beds: 2, total: 132, area: 20, rowLength: 40
  });
});

test('показывает ноль, когда ряд физически не помещается', () => {
  assert.equal(calculatePlanting({ length: '1', width: '0,4', beds: '1', rowSpacing: '50', plantSpacing: '25' }).total, 0);
});

test('отклоняет ноль, отрицательные и дробное число грядок', () => {
  const base = { length: 10, width: 1, beds: 1, rowSpacing: 50, plantSpacing: 30 };
  assert.throws(() => calculatePlanting({ ...base, plantSpacing: 0 }), RangeError);
  assert.throws(() => calculatePlanting({ ...base, width: -1 }), RangeError);
  assert.throws(() => calculatePlanting({ ...base, beds: 1.5 }), RangeError);
});
