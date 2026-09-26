import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDrip } from '../assets/drip-model.mjs';

test('оценивает расход и объём по длине ленты и шагу', () => {
  const result = calculateDrip({ length: 20, spacing: 20, flow: 1.6, mode: 'duration', minutes: 30 });
  assert.deepEqual(result, { emitterCount: 100, estimated: true, hourlyLiters: 160, minutes: 30, volumeLiters: 80 });
});

test('по фактическому числу капельниц вычисляет время для заданного объёма', () => {
  const result = calculateDrip({ length: 20, spacing: 20, flow: 2, emitterCount: 80, mode: 'volume', volumeLiters: 40 });
  assert.deepEqual(result, { emitterCount: 80, estimated: false, hourlyLiters: 160, minutes: 15, volumeLiters: 40 });
});

test('отклоняет неверную геометрию, пустой расход и дробное фактическое число', () => {
  const base = { length: 20, spacing: 20, flow: 2, mode: 'duration', minutes: 30 };
  assert.throws(() => calculateDrip({ ...base, length: 0 }), RangeError);
  assert.throws(() => calculateDrip({ ...base, spacing: '' }), RangeError);
  assert.throws(() => calculateDrip({ ...base, flow: '' }), RangeError);
  assert.throws(() => calculateDrip({ ...base, emitterCount: 2.5 }), /целым/);
  assert.throws(() => calculateDrip({ ...base, mode: 'other' }), /режим/);
});

test('не выдаёт нулевое число капельниц или недельный непрерывный полив', () => {
  assert.throws(() => calculateDrip({ length: 0.1, spacing: 100, flow: 2, mode: 'duration', minutes: 10 }), /Невозможно оценить/);
  assert.throws(() => calculateDrip({ length: 1, spacing: 100, flow: 1, mode: 'volume', volumeLiters: 1000 }), /больше недели/);
});
