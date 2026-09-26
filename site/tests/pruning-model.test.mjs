import test from 'node:test';
import assert from 'node:assert/strict';
import { pruningAdvice } from '../assets/pruning-model.mjs';

test('unknown type never recommends cutting all canes', () => {
  const result = pruningAdvice({ type: 'unknown', harvest: 'single' });
  assert.match(result.summary, /не срезайте все/);
});

test('summer-bearing result preserves new canes', () => {
  const result = pruningAdvice({ type: 'summer', harvest: 'double' });
  assert.match(result.summary, /Побеги текущего года оставьте/);
});

test('primocane strategies remain distinct', () => {
  const single = pruningAdvice({ type: 'primocane', harvest: 'single' });
  const double = pruningAdvice({ type: 'primocane', harvest: 'double' });
  assert.notEqual(single.title, double.title);
  assert.match(double.summary, /только сильным/);
  assert.equal(pruningAdvice({ type: 'primocane', harvest: '' }).title, pruningAdvice({ type: 'unknown' }).title);
});

test('unexpected type is rejected', () => {
  assert.throws(() => pruningAdvice({ type: 'strawberry' }), RangeError);
});
