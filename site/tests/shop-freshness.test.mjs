import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../assets/site.js', import.meta.url), 'utf8');
const freshness = source.slice(0, source.indexOf('const menuButton'));
const filterSource = await readFile(new URL('../assets/shop-filter.js', import.meta.url), 'utf8');

function harness() {
  const cards = ['in_stock', 'out_of_stock', 'unknown'].map((stock, index) => ({
    dataset: { stock, search: index === 1 ? 'клубника азия' : 'малина гусар' }, hidden: false
  }));
  const labels = cards.map(() => ({ textContent: 'Старый статус', removeAttribute() {} }));
  const count = { textContent: '' };
  const query = { value: '', addEventListener(type, fn) { this[type] = fn; } };
  const stock = {
    value: 'all', options: ['all', 'in_stock', 'out_of_stock', 'unknown'].map(value => ({ value })),
    addEventListener(type, fn) { this[type] = fn; }, dispatchEvent(event) { this[event.type]?.(); }
  };
  const sectionCount = { textContent: '' };
  const section = {
    hidden: false, querySelector: () => sectionCount,
    querySelectorAll: () => cards.filter(card => !card.hidden)
  };
  const listeners = new Map();
  const window = {
    setInterval() {},
    addEventListener(type, fn) { listeners.set(type, [...(listeners.get(type) || []), fn]); }
  };
  const document = {
    documentElement: { dataset: { shopOffersExpires: '2999-01-01T00:00:00Z' } },
    addEventListener() {},
    querySelector(selector) {
      if (selector === '[data-shop-query]') return query;
      if (selector === '[data-shop-stock]') return stock;
      if (selector === '[data-shop-count]') return count;
      if (selector.startsWith('[data-shop-live-price],')) return labels[0];
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-shop-card]') return cards;
      if (selector === '[data-shop-section]') return [section];
      if (selector === '[data-shop-stock-label], [data-shop-live-price]') return labels;
      return [];
    }
  };
  const context = { document, window, Date, Event: class { constructor(type) { this.type = type; } } };
  runInNewContext(freshness + filterSource, context);
  const show = () => { for (const fn of listeners.get('pageshow') || []) fn(); };
  return { cards, labels, count, query, stock, sectionCount, show, document };
}

test('counts represent unique visible cards, and stock options retain total counts', () => {
  const state = harness();
  assert.equal(state.count.textContent, 'Показано 3 товара');
  assert.deepEqual(state.stock.options.map(option => option.textContent), [
    'Все товары (3)', 'Есть в наличии (1)', 'Нет в наличии (1)', 'Наличие уточняется (1)'
  ]);
  state.query.value = 'азия';
  state.query.input();
  assert.equal(state.count.textContent, 'Показано 1 товар из 3');
  assert.equal(state.sectionCount.textContent, 1);
  state.stock.value = 'in_stock';
  state.stock.change();
  assert.equal(state.cards.every(card => card.hidden), true);
  assert.match(state.count.textContent, /Попробуйте другой запрос/);
});

test('returning from a seller clears both old stock states, preserves search and restores browsing', () => {
  const state = harness();
  state.query.value = 'азия';
  state.stock.value = 'out_of_stock';
  state.stock.change();
  state.document.documentElement.dataset.shopOffersExpires = '2020-01-01T00:00:00Z';
  state.show();
  assert.equal(state.stock.value, 'all');
  assert.equal(state.query.value, 'азия');
  assert.equal(state.cards.every(card => card.dataset.stock === 'unknown'), true);
  assert.equal(state.labels.every(label => label.textContent === 'Наличие уточняется'), true);
  assert.equal(state.count.textContent, 'Показано 1 товар из 3');
  assert.deepEqual(state.stock.options.map(option => option.disabled), [false, true, true, false]);
  assert.equal(state.stock.options[3].textContent, 'Наличие уточняется (3)');
  state.stock.value = 'unknown';
  state.show();
  assert.equal(state.stock.value, 'unknown');
});
