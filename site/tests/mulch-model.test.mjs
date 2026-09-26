import test from 'node:test';
import assert from 'node:assert/strict';
import { compareMulch, mulchSources } from '../assets/mulch-model.mjs';

test('мульча различает системы клубники и зимнюю задачу', () => {
  const june = compareMulch({ crop: 'strawberry', system: 'june', goal: 'berries' });
  const neutral = compareMulch({ crop: 'strawberry', system: 'day-neutral', goal: 'berries' });
  const winter = compareMulch({ crop: 'strawberry', system: 'day-neutral', goal: 'winter' });
  assert.match(june.options[0].material, /Солома/);
  assert.match(neutral.options[0].material, /Плёночная/);
  assert.match(winter.options[0].limit, /Не является обычной летней/);
  assert.notEqual(june.options[0].source, neutral.options[0].source);
});

test('малина не получает клубничный совет, а каждый результат имеет источник', () => {
  const raspberry = compareMulch({ crop: 'raspberry', system: 'june', goal: 'weeds' });
  assert.match(raspberry.options[0].limit, /грызунами/);
  const berries = compareMulch({ crop: 'raspberry', system: 'june', goal: 'berries' });
  assert.equal(berries.options.length, 0);
  assert.match(berries.next.url, /shpalery/);
  for (const crop of ['strawberry', 'raspberry']) for (const goal of ['berries', 'weeds', 'winter']) {
    const result = compareMulch({ crop, system: 'june', goal });
    for (const option of result.options) assert.match(mulchSources[option.source].url, /^https:\/\//);
  }
  assert.throws(() => compareMulch({ crop: 'strawberry', system: 'unknown', goal: 'winter' }), RangeError);
});
