import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import * as model from '../assets/comparison-model.mjs';

const source = (await readFile(new URL('../assets/comparison.js', import.meta.url), 'utf8')).replace(/^import .*comparison-model\.mjs';\n/m, '');

function element(tagName = 'div') {
  let ownText = '';
  return {
    tagName, children: [], listeners: new Map(), dataset: {}, hidden: false,
    checked: false, disabled: false, value: '', focused: false, selected: false,
    get textContent() { return ownText + this.children.map(child => child.textContent).join(''); },
    set textContent(value) { ownText = String(value); this.children = []; },
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { ownText = ''; this.children = children; },
    setAttribute(name, value) { this[name] = value; },
    addEventListener(type, listener) { this.listeners.set(type, listener); },
    async dispatch(type) { await this.listeners.get(type)?.({ target: this }); },
    querySelector(selector) { return this.children.find(child => child.tagName === selector) || null; },
    focus() { this.focused = true; },
    select() { this.selected = true; }
  };
}

const weight = {
  trait_code: 'berry_weight_g', value_number: 18, unit: 'г',
  source_url: 'https://example.test/trial.pdf', source_title: 'Сортоиспытание',
  evidence: { place_text: 'Коломна, Московская область', period_from: '2022', period_to: '2023', setting_text: 'Открытый грунт', source_locator: 'Таблица 1' }
};

function comparisonHarness({ search = '?sort=alpha,beta', clipboard = { writeText: async () => {} } } = {}) {
  const varieties = [
    { name: 'Альфа', slug: 'alpha', cropKey: 'raspberry', crop: 'Малина', fruitingLabel: 'Летняя', period: null, place: 'Открытый грунт', note: 'Красная ягода', observations: [weight], source: 'https://example.test/alpha', sourceLabel: 'Описание' },
    { name: 'Бета', slug: 'beta', cropKey: 'raspberry', crop: 'Малина', fruitingLabel: null, period: null, place: 'Открытый грунт', note: 'Красная ягода', observations: [], source: 'https://example.test/beta', sourceLabel: 'Описание' },
    { name: 'Гамма', slug: 'gamma', cropKey: 'raspberry', crop: 'Малина', observations: [] }
  ];
  const selectors = [
    '#comparison-status', '.comparison-table thead tr', '#comparison-rows', '.comparison-table', '.comparison-table-wrap',
    '#comparison-chooser', '#comparison-sources', '#comparison-differences', '#comparison-selected', '#comparison-copy',
    '#comparison-share-fallback', '#comparison-share-url', '#comparison-search', '#comparison-next', '#comparison-context',
    '#comparison-tools', '#comparison-return-picker', '#comparison-search-count', '#comparison-search-empty', '#comparison-clear',
    '#comparison-empty-differences'
  ];
  const nodes = new Map(selectors.map(selector => [selector, element()]));
  nodes.get('#comparison-sources').append(element('ul'));
  nodes.get('#comparison-share-url').readOnly = true;
  const choices = varieties.map(variety => {
    const input = element('input');
    input.value = variety.slug;
    const label = element('label');
    label.append(element('a'));
    input.closest = () => label;
    return input;
  });
  const root = element();
  root.dataset = { crop: 'raspberry', reviewedAt: '2026-10-05' };
  root.querySelector = selector => nodes.get(selector);
  root.querySelectorAll = () => choices;
  const data = element('script');
  data.textContent = JSON.stringify({ varieties, cities: [], regions: [] });
  const location = { origin: 'https://example.test', search };
  const history = {
    href: '',
    replaceState(_state, _title, href) {
      this.href = href;
      location.search = new URL(href, location.origin).search;
    }
  };
  runInNewContext(source, {
    ...model, URL, URLSearchParams, location, history, navigator: { clipboard },
    document: {
      documentElement: { dataset: {} },
      querySelector: selector => selector === '#comparison' ? root : selector === '#comparison-data' ? data : null,
      createElement: element,
      createTextNode: text => { const node = element('#text'); node.textContent = text; return node; }
    }
  });
  return { nodes, choices, location, history, rows: () => nodes.get('#comparison-rows').children };
}

test('сравнение без места показывает массу ягоды вместе с условиями опыта', () => {
  const ui = comparisonHarness();
  assert.equal(ui.nodes.get('.comparison-table-wrap').hidden, false);
  const rows = ui.rows();
  assert.equal(rows.length, 7);
  const mass = rows.find(row => row.children[0].textContent === 'Масса ягоды');
  assert.match(mass.children[1].textContent, /18 г/);
  assert.match(mass.children[1].textContent, /Коломна, Московская область · 2022–2023 · Открытый грунт/);
  assert.equal(mass.children[2].textContent, '—');
  assert.equal(rows.some(row => row.children[0].textContent === 'Есть ли сорт в официальном списке'), false);
});

test('поиск среди вариантов не снимает уже выбранные сорта', async () => {
  const ui = comparisonHarness();
  const initialHref = ui.history.href;
  const search = ui.nodes.get('#comparison-search');
  search.value = 'Гамма';
  await search.dispatch('input');
  assert.equal(ui.choices[0].closest().hidden, true);
  assert.equal(ui.choices[1].closest().hidden, true);
  assert.equal(ui.choices[2].closest().hidden, false);
  assert.equal(ui.choices[0].checked, true);
  assert.equal(ui.choices[1].checked, true);
  assert.equal(ui.nodes.get('#comparison-selected').children.length, 2);
  assert.equal(ui.nodes.get('.comparison-table thead tr').children.length, 3);
  assert.equal(ui.history.href, initialHref);
  assert.equal(new URL(ui.history.href, ui.location.origin).searchParams.get('sort'), 'alpha,beta');
});

test('отказ буфера обмена оставляет выделенную ссылку для ручного копирования', async () => {
  const ui = comparisonHarness({ clipboard: { writeText: async () => { throw new Error('NotAllowedError'); } } });
  await ui.nodes.get('#comparison-copy').dispatch('click');
  const field = ui.nodes.get('#comparison-share-url');
  assert.equal(ui.nodes.get('#comparison-share-fallback').hidden, false);
  assert.equal(field.value, 'https://example.test/sravnenie/malina/?sort=alpha%2Cbeta');
  assert.equal(field.readOnly, true);
  assert.equal(field.focused, true);
  assert.equal(field.selected, true);
  assert.match(ui.nodes.get('#comparison-status').textContent, /скопируйте её вручную/);
});

test('режим отличий скрывает общие и пустые строки, сохраняя известное рядом с неизвестным', async () => {
  const ui = comparisonHarness();
  const toggle = ui.nodes.get('#comparison-differences');
  toggle.checked = true;
  await toggle.dispatch('change');
  const rowByLabel = label => ui.rows().find(row => row.children[0].textContent === label);
  assert.equal(rowByLabel('Культура').hidden, true);
  assert.equal(rowByLabel('Когда созревает').hidden, true);
  assert.equal(rowByLabel('Урожайность').hidden, true);
  assert.equal(rowByLabel('Тип плодоношения').hidden, false);
  assert.equal(rowByLabel('Масса ягоды').hidden, false);
  assert.equal(rowByLabel('Тип плодоношения').children[2].textContent, '—');
  assert.equal(new URL(ui.history.href, ui.location.origin).searchParams.get('diff'), '1');
  toggle.checked = false;
  await toggle.dispatch('change');
  assert.equal(ui.rows().every(row => !row.hidden), true);
  assert.equal(new URL(ui.history.href, ui.location.origin).searchParams.has('diff'), false);
});

test('переход из подбора передаёт фактические радиокнопки участка и выбранный город', async () => {
  const pickerSource = (await readFile(new URL('../assets/picker-compare.js', import.meta.url), 'utf8')).replace(/^import .*comparison-model\.mjs';\n/m, '');
  const fields = { setting: 'ground', light: 'sun', fruiting: 'remontant', harvestTiming: 'autumn', shelter: 'yes', drainage: 'drained' };
  const form = element('form');
  form.dataset = { activeRegion: 'Московская область', activeCity: 'Москва' };
  form.elements = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, { value }]));
  form.elements.region = { value: 'Москва' };
  form.querySelector = () => null;
  const nodes = new Map(['#picker-compare-bar', '#picker-compare-status', '#picker-compare-link'].map(selector => [selector, element()]));
  const output = element();
  output.querySelector = selector => nodes.get(selector);
  output.querySelectorAll = () => ['polka', 'joan-j'].map(slug => {
    const checkbox = element('input');
    checkbox.value = slug;
    checkbox.checked = true;
    const card = element('article');
    card.dataset = { crop: 'raspberry' };
    const option = element('label');
    checkbox.closest = selector => selector === '.variety-card' ? card : option;
    return checkbox;
  });
  runInNewContext(pickerSource, {
    ...model, URLSearchParams,
    document: {
      documentElement: { dataset: { siteBase: '/MALINA' } },
      querySelector: selector => selector === '#picker-output' ? output : selector === '#picker-form' ? form : null
    }
  });
  const link = nodes.get('#picker-compare-link');
  assert.equal(link.hidden, false);
  const url = new URL(link.href, 'https://example.test');
  assert.equal(url.pathname, '/MALINA/sravnenie/malina/');
  assert.equal(url.searchParams.get('sort'), 'polka,joan-j');
  assert.equal(url.searchParams.get('region'), 'Московская область');
  assert.equal(url.searchParams.get('city'), 'Москва');
  for (const [key, value] of Object.entries(fields)) assert.equal(url.searchParams.get(key), value, key);
});
