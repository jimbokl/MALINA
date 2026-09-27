import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { resolvePickerPlace, normalizePickerPlace } from '../assets/picker-place.mjs';
import { describePickerCardReason } from '../assets/picker-filter.mjs';

class FakeElement {
  constructor() {
    this.children = [];
    this.listeners = new Map();
    this.dataset = {};
    this.style = {};
    this.hidden = false;
    this.value = '';
  }
  append(...children) { this.children.push(...children); }
  prepend(child) { this.children.unshift(child); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this[name] = value; }
  addEventListener(name, listener) {
    const listeners = this.listeners.get(name) || [];
    listeners.push(listener);
    this.listeners.set(name, listeners);
  }
  dispatchEvent(event) {
    for (const listener of this.listeners.get(event.type) || []) listener(event);
  }
  click() { this.dispatchEvent({ type: 'click' }); }
  focus() { this.focused = true; }
  reportValidity() { return false; }
  scrollIntoView() { this.scrolled = true; }
  querySelector(selector) {
    return this.children.find(child => child.className?.split(' ').includes(selector.slice(1)))
      || this.children.flatMap(child => child.children || []).find(child => child.className?.split(' ').includes(selector.slice(1)));
  }
  querySelectorAll() { return []; }
}

const tick = () => new Promise(resolve => setImmediate(resolve));

test('карточка показывает только выбранные и подтверждённые признаки', () => {
  assert.equal(
    describePickerCardReason({ light: 'sun', setting: 'ground', fruiting: 'remontant', harvestTiming: 'unknown' }, { status: 'match' }),
    'солнечное место · грядка · ремонтантное плодоношение'
  );
  assert.equal(
    describePickerCardReason({ light: 'unknown', setting: 'all', fruiting: 'all', harvestTiming: 'autumn' }, { status: 'match' }),
    'осенний срок'
  );
  assert.equal(
    describePickerCardReason({ light: 'unknown', setting: 'all', fruiting: 'all', harvestTiming: 'all' }, { status: 'match' }),
    ''
  );
  assert.equal(
    describePickerCardReason({ light: 'sun', setting: 'all', fruiting: 'all', harvestTiming: 'all' }, { status: 'needs-evidence' }),
    ''
  );
});

test('после результата можно вернуться к простой форме без потери выбранного места', async () => {
  const source = await readFile(new URL('../assets/picker-wizard.js', import.meta.url), 'utf8');
  const form = new FakeElement();
  const place = new FakeElement();
  const editResultsButton = new FakeElement();
  const output = new FakeElement();
  const memo = new FakeElement();
  form.querySelector = selector => selector === '#picker-region' ? place : null;
  place.value = 'Тула';
  output.hidden = false;
  memo.hidden = false;
  runInNewContext(source, {
    document: { querySelector: selector => ({
      '#picker-form': form,
      '#picker-edit-conditions': editResultsButton,
      '#picker-output': output,
      '#picker-memo': memo
    })[selector] || null },
    matchMedia: () => ({ matches: true })
  });
  editResultsButton.click();
  assert.equal(output.hidden, true);
  assert.equal(memo.hidden, true);
  assert.equal(place.value, 'Тула');
  assert.equal(place.focused, true);
  assert.equal(form.scrolled, true);
});

test('подбор показывает сорта порциями и не прячет выбранное при обновлении порядка', async () => {
  const source = await readFile(new URL('../assets/picker-wizard.js', import.meta.url), 'utf8');
  const form = new FakeElement();
  const output = new FakeElement();
  const results = new FakeElement();
  const more = new FakeElement();
  const edit = new FakeElement();
  const heading = new FakeElement();
  heading.className = 'picker-group-heading';
  heading.classList = { contains: name => name === heading.className };
  const cards = Array.from({ length: 12 }, (_, index) => {
    const card = new FakeElement();
    card.className = 'variety-card';
    card.classList = { contains: name => name === card.className };
    card.dataset.pickerVisible = 'true';
    const checkbox = { checked: false };
    const link = { focus() { this.focused = true; } };
    card.querySelector = selector => selector === '.picker-compare-checkbox' ? checkbox : link;
    card.link = link;
    card.checkbox = checkbox;
    return card;
  });
  results.querySelectorAll = selector => selector === '.variety-card' ? cards : [heading];
  heading.nextElementSibling = cards[0];
  for (let index = 0; index < cards.length - 1; index++) cards[index].nextElementSibling = cards[index + 1];
  runInNewContext(source, {
    document: { querySelector: selector => ({
      '#picker-form': form,
      '#picker-edit-conditions': edit,
      '#picker-output': output,
      '#picker-results': results,
      '#picker-show-more': more
    })[selector] || null },
    Event: class { constructor(type) { this.type = type; } },
    matchMedia: () => ({ matches: true })
  });
  output.dispatchEvent({ type: 'picker:results' });
  assert.equal(cards.filter(card => !card.hidden).length, 8);
  assert.equal(more.textContent, 'Показать ещё 4 из 4');
  cards[10].checkbox.checked = true;
  output.dispatchEvent({ type: 'picker:order-change' });
  assert.equal(cards.filter(card => !card.hidden).length, 11);
  assert.equal(more.textContent, 'Показать ещё 1 из 1');
  more.click();
  assert.equal(cards.filter(card => !card.hidden).length, 12);
  assert.equal(more.hidden, true);
  assert.equal(cards[11].link.focused, true);
  assert.equal(heading.hidden, false);
});

test('подтверждение неизвестного места сохраняется после подбора и сбрасывается при редактировании', async () => {
  const source = await readFile(new URL('../assets/site.js', import.meta.url), 'utf8');
  const pickerSource = source.slice(source.indexOf('const pickerForm = document.querySelector'), source.length)
    .replace(/\bimport\s*\(/g, '__import(');
  const form = new FakeElement();
  const place = new FakeElement();
  const cityContext = new FakeElement();
  const error = new FakeElement();
  const continueButton = new FakeElement();
  const output = new FakeElement();
  const memo = new FakeElement();
  const results = new FakeElement();
  const empty = new FakeElement();
  const compareCheckbox = new FakeElement();
  compareCheckbox.checked = true;
  output.querySelectorAll = selector => selector === '.picker-compare-checkbox' ? [compareCheckbox] : [];
  output.hidden = false;
  memo.hidden = false;
  form.dataset.activeCity = 'Тула';
  form.dataset.activeRegion = 'Тульская область';
  const nodes = new Map([
    ['#picker-form', form], ['#picker-output', output], ['#picker-memo', memo], ['#picker-results', results],
    ['#picker-empty', empty], ['#picker-title', new FakeElement()],
    ['#picker-region-status', new FakeElement()], ['#picker-description', new FakeElement()],
    ['#picker-conditions', new FakeElement()], ['#verified-status', new FakeElement()],
    ['#verified-results', new FakeElement()]
  ]);
  form.querySelector = selector => ({
    '#picker-region': place,
    '#picker-city-context': cityContext,
    '#picker-place-error': error,
    '#picker-place-continue': continueButton
  })[selector];
  form.querySelectorAll = () => [];
  place.value = 'Мой посёлок';
  const values = { region: place.value, crop: 'raspberry', setting: 'all', light: 'unknown', fruiting: 'all', harvestTiming: 'all', shelter: 'unknown', drainage: 'unknown' };
  const context = {
    document: { querySelector: selector => nodes.get(selector), querySelectorAll: () => [], createElement: () => new FakeElement() },
    location: { search: '', origin: 'https://example.test' }, URL, URLSearchParams,
    CustomEvent: class { constructor(type) { this.type = type; } },
    Event: class { constructor(type) { this.type = type; } },
    FormData: class { get(name) { return name === 'region' ? place.value : values[name]; } },
    matchMedia: () => ({ matches: true }),
    trackGoal() {},
    __import: async specifier => specifier.includes('picker-place')
      ? { resolvePickerPlace, normalizePickerPlace }
      : { classifyPickerCard() {}, cityForPickerContext: () => '' }
  };
  runInNewContext(pickerSource, context);
  // Input during the async place-module load must already invalidate Tula's visible results.
  place.value = 'Мой посёлок';
  place.dispatchEvent({ type: 'input' });
  assert.equal(output.hidden, true);
  assert.equal(memo.hidden, true);
  assert.equal(compareCheckbox.checked, false);
  assert.equal(form.dataset.activeCity, undefined);
  assert.equal(form.dataset.activeRegion, undefined);
  await tick();
  form.requestSubmit = () => form.dispatchEvent({ type: 'submit', preventDefault() {}, stopImmediatePropagation() {} });
  continueButton.click();
  assert.equal(form.dataset.allowUnknownPlace, 'true');
  const submit = async () => form.dispatchEvent({ type: 'submit', preventDefault() {}, stopImmediatePropagation() {} });
  await submit();
  await submit();
  assert.equal(error.hidden, true);
  assert.equal(form.dataset.allowUnknownPlace, 'true');

  place.value = 'Другое место';
  place.dispatchEvent({ type: 'input' });
  assert.equal(form.dataset.allowUnknownPlace, undefined);
  await submit();
  assert.equal(error.hidden, false);
});
