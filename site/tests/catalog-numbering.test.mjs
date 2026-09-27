import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('../assets/site.js', import.meta.url), 'utf8');

test('catalog numbers follow the visible cards after each filter change', () => {
  const listeners = new Map();
  const form = {
    values: { crop: 'all', setting: 'all', fruiting: 'all', fruitColor: 'all', query: '' },
    addEventListener(type, listener) { listeners.set(type, listener); }
  };
  const card = (crop, name, originalNumber) => {
    const number = { textContent: originalNumber };
    return {
      dataset: { crop, name, setting: 'open', fruiting: 'summer', fruitColor: 'red' },
      hidden: false,
      number,
      querySelector(selector) { return selector === '.variety-number' ? number : null; }
    };
  };
  const cards = [
    card('raspberry', 'малина первая', '12 / 86'),
    card('strawberry', 'клубника', '63 / 86'),
    card('raspberry', 'малина вторая', '40 / 86')
  ];
  const count = { textContent: '' };
  const empty = { hidden: true };
  const nodes = { '#catalog-form': form, '#catalog-count': count, '#catalog-empty': empty, '#catalog-results': { dataset: {} } };
  const document = {
    documentElement: { dataset: { ymCounter: '', siteBase: '' } },
    referrer: '',
    querySelector(selector) { return nodes[selector] || null; },
    querySelectorAll(selector) { return selector === '#catalog-results .variety-card' ? cards : []; },
    addEventListener() {}
  };
  class MockFormData {
    constructor(source) { this.values = source.values; }
    get(name) { return this.values[name] ?? null; }
  }
  const location = new URL('https://example.test/sorta/');
  runInNewContext(script, { document, location, window: { addEventListener() {} }, URL, URLSearchParams, FormData: MockFormData });

  assert.deepEqual(cards.map(item => item.number.textContent), ['01 / 03', '02 / 03', '03 / 03']);
  form.values.crop = 'raspberry';
  listeners.get('change')();
  assert.deepEqual(cards.map(item => item.hidden), [false, true, false]);
  assert.deepEqual([cards[0].number.textContent, cards[2].number.textContent], ['01 / 02', '02 / 02']);
  assert.equal(count.textContent, '2 сорта для сравнения');

  form.values.query = 'вторая';
  listeners.get('input')();
  assert.deepEqual(cards.map(item => item.hidden), [true, true, false]);
  assert.equal(cards[2].number.textContent, '01 / 01');

  form.values.crop = 'strawberry';
  listeners.get('change')();
  assert.equal(empty.hidden, false);
  form.values.query = '';
  listeners.get('input')();
  assert.equal(cards[1].number.textContent, '01 / 01');
});
