import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../assets/site.js', import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));

class Element {
  constructor(fields = {}) {
    this.listeners = new Map();
    this.dataset = {};
    this.hidden = false;
    this.textContent = '';
    Object.assign(this, fields);
  }
  addEventListener(type, listener) {
    this.listeners.set(type, [...(this.listeners.get(type) || []), listener]);
  }
  async dispatchEvent(event) {
    for (const listener of this.listeners.get(event.type) || []) await listener(event);
  }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  replaceChildren() {}
  scrollIntoView() {}
  focus() {}
}

function harness({ path, counter = '', base = '', nodes = new Map(), referrer = '' }) {
  const calls = [];
  const appended = [];
  const location = new URL(`https://example.test${path}`);
  const document = new Element();
  const window = new Element({ ym: (...args) => calls.push(args) });
  document.documentElement = { dataset: { ymCounter: counter, siteBase: base } };
  document.referrer = referrer;
  document.head = { append: element => appended.push(element) };
  document.createElement = () => new Element();
  document.querySelector = selector => nodes.get(selector) || null;
  document.querySelectorAll = () => [];
  const observers = [];
  const context = {
    document, window, location, URL, URLSearchParams,
    navigator: {}, matchMedia: () => ({ matches: true }),
    Event: class { constructor(type) { this.type = type; } },
    CustomEvent: class { constructor(type) { this.type = type; } },
    MutationObserver: class {
      constructor(callback) { this.callback = callback; observers.push(this); }
      observe() {}
    },
    FormData: class { constructor(form) { this.values = form.values; } get(key) { return this.values[key]; } },
    __import: async name => name.includes('picker-place')
      ? {
          resolvePickerPlace: (value, places) => places.find(place => place.name === value),
          normalizePickerPlace: value => value.toLowerCase()
        }
      : {
          classifyPickerCard: () => ({ status: 'exclude' }),
          cityForPickerContext: () => '',
          describePickerCardReason: () => '',
          describePickerResults: () => 'No matches'
        }
  };
  runInNewContext(source.replace(/\bimport\s*\(/g, '__import('), context);
  const goals = () => calls.filter(call => call[1] === 'reachGoal').map(call => ({ name: call[2], params: JSON.parse(JSON.stringify(call[3])) }));
  return { calls, goals, appended, document, window, observers };
}

function target(selectors, fields = {}) {
  return {
    ...fields,
    closest(selector) { return selectors.has(selector) ? this : null; },
    getAttribute(name) { return this[name]; }
  };
}

test('collector remains inert without a configured counter', async () => {
  const state = harness({ path: '/sorta/polka/?city=PRIVATE_CITY', nodes: new Map([
    ['.variety-hero-art.raspberry', new Element()]
  ]) });
  await state.window.dispatchEvent({ type: 'unhandledrejection', reason: Error('PRIVATE_ERROR') });
  assert.equal(state.appended.length, 0);
  assert.deepEqual(state.calls, []);
});

test('configured page hit, cultivar and technical error goals omit query and error details', async () => {
  const state = harness({
    path: '/MALINA/sorta/polka/?city=PRIVATE_CITY', base: '/MALINA', counter: '12345',
    referrer: 'https://example.test/podbor/?region=PRIVATE_REGION',
    nodes: new Map([['.variety-hero-art.raspberry', new Element()]])
  });
  assert.equal(state.appended.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(state.calls[0].slice(1))), ['init', {
    defer: true, clickmap: false, webvisor: false, trackLinks: false, sendTitle: false
  }]);
  assert.deepEqual(JSON.parse(JSON.stringify(state.calls[1].slice(1))), [
    'hit', '/MALINA/sorta/polka/', { referer: 'https://example.test/podbor/' }
  ]);
  assert.deepEqual(state.goals()[0], {
    name: 'cultivar_view', params: { page_type: 'cultivar', crop: 'raspberry', cultivar: 'polka' }
  });
  await state.window.dispatchEvent({
    type: 'error', filename: 'https://example.test/MALINA/assets/site.js?token=PRIVATE_TOKEN',
    message: 'PRIVATE_ERROR', error: Error('PRIVATE_ERROR')
  });
  await state.window.dispatchEvent({ type: 'unhandledrejection', reason: Error('PRIVATE_ERROR') });
  assert.deepEqual(state.goals().slice(1), [
    { name: 'site_technical_error', params: { page_type: 'cultivar', component: 'site', error_type: 'script' } },
    { name: 'site_technical_error', params: { page_type: 'cultivar', component: 'cultivar', error_type: 'promise' } }
  ]);
  assert.doesNotMatch(JSON.stringify(state.calls), /PRIVATE_/);
});

test('comparison transitions and additions record only controlled dimensions', async () => {
  const comparison = new Element({ dataset: { crop: 'raspberry' } });
  const state = harness({
    path: '/sravnenie/malina/?city=PRIVATE_CITY', counter: '12345',
    nodes: new Map([['#comparison', comparison]])
  });
  const cultivarLink = target(new Set(['#comparison a[href*="/sorta/"]']), { href: '/sorta/polka/?city=PRIVATE_CITY' });
  await state.document.dispatchEvent({ type: 'click', target: cultivarLink });
  const checkbox = {
    checked: true,
    matches: selector => selector.includes('#comparison input'),
    closest: selector => selector === '.variety-card' ? null : null
  };
  await state.document.dispatchEvent({ type: 'change', target: checkbox });
  assert.deepEqual(state.goals(), [
    { name: 'comparison_to_cultivar', params: { page_type: 'comparison', crop: 'raspberry', cultivar: 'polka' } },
    { name: 'comparison_add', params: { page_type: 'comparison', crop: 'raspberry', source: 'comparison' } }
  ]);
  assert.doesNotMatch(JSON.stringify(state.calls), /PRIVATE_CITY/);
});

test('selector comparison, checkbox and memo clicks use controlled dimensions', async () => {
  const picker = new Element({ elements: { crop: { value: 'strawberry' } } });
  picker.querySelector = () => new Element({ value: '' });
  const memo = new Element();
  const state = harness({
    path: '/podbor/?region=PRIVATE_REGION', counter: '12345',
    nodes: new Map([['#picker-form', picker], ['#picker-memo', memo]])
  });
  await state.document.dispatchEvent({
    type: 'click', target: target(new Set(['#picker-compare-link']), { hidden: false })
  });
  await state.document.dispatchEvent({
    type: 'change', target: {
      checked: true,
      matches: selector => selector.includes('.picker-compare-checkbox'),
      closest: selector => selector === '.variety-card' ? { dataset: { crop: 'strawberry' } } : null
    }
  });
  await state.document.dispatchEvent({
    type: 'click', target: target(new Set(['#picker-memo-print']))
  });
  assert.deepEqual(state.goals(), [
    { name: 'comparison_open', params: { page_type: 'selector', crop: 'strawberry' } },
    { name: 'comparison_add', params: { page_type: 'selector', crop: 'strawberry', source: 'selector' } },
    { name: 'memo_print_requested', params: { page_type: 'selector', crop: 'strawberry' } }
  ]);
  assert.doesNotMatch(JSON.stringify(state.calls), /PRIVATE_REGION/);
});

test('article and affiliate goals reject raw URLs and uncontrolled IDs', async () => {
  const state = harness({ path: '/zhurnal/?city=PRIVATE_CITY', counter: '12345' });
  await state.document.dispatchEvent({
    type: 'click', target: target(new Set(['[data-article-to-cultivar]']), {
      dataset: { articleToCultivar: 'berry-guide' },
      href: '/sorta/polka/?region=PRIVATE_REGION'
    })
  });
  await state.document.dispatchEvent({
    type: 'click', target: target(new Set(['[data-affiliate-offer]']), {
      dataset: { affiliateOffer: 'offer-1?PRIVATE_TOKEN', cultivar: 'polka' }
    })
  });
  assert.deepEqual(state.goals(), [
    { name: 'article_to_cultivar', params: { page_type: 'other', article: 'berry-guide', cultivar: 'polka' } },
    { name: 'affiliate_click', params: { page_type: 'other', cultivar: 'polka' } }
  ]);
  assert.doesNotMatch(JSON.stringify(state.calls), /PRIVATE_/);
});

test('selector start, regional rule outcomes, error and completion send no form text', async () => {
  const picker = new Element({
    elements: { crop: { value: 'raspberry' } },
    values: {
      region: 'PRIVATE_REGION', crop: 'raspberry', setting: 'all', light: 'unknown',
      fruiting: 'all', harvestTiming: 'PRIVATE_TIMING', shelter: 'unknown', drainage: 'unknown'
    }
  });
  const region = new Element({ value: 'PRIVATE_REGION' });
  const place = new Element({ value: 'PRIVATE_REGION', dataset: { region: 'PRIVATE_REGION', city: '' } });
  const status = new Element();
  const nodes = new Map([
    ['#picker-form', picker], ['#verified-status', status], ['#picker-output', new Element()],
    ['#picker-results', new Element()], ['#picker-memo', new Element()], ['#picker-empty', new Element()],
    ['#picker-title', new Element()], ['#picker-region-status', new Element()],
    ['#picker-description', new Element()], ['#picker-conditions', new Element()]
  ]);
  const pickerNodes = new Map([
    ['#picker-region', region], ['#picker-city-context', new Element()],
    ['#picker-place-error', new Element()], ['#picker-place-continue', new Element()]
  ]);
  picker.querySelector = selector => pickerNodes.get(selector) || null;
  picker.querySelectorAll = selector => selector === '#picker-places option' ? [place] : [];
  const state = harness({ path: '/podbor/tula/?city=PRIVATE_CITY', counter: '12345', nodes });
  await tick();
  await picker.dispatchEvent({ type: 'focusin' });
  await picker.dispatchEvent({ type: 'focusin' });
  status.textContent = 'Регион не сопоставлен с районированием Госреестра.';
  state.observers[0].callback();
  state.observers[0].callback();
  status.textContent = 'Не удалось загрузить данные Госреестра. Попробуйте позже.';
  state.observers[0].callback();
  status.textContent = '1 сорт с проверенным региональным правилом для региона «PRIVATE_REGION».';
  state.observers[0].callback();
  await picker.dispatchEvent({ type: 'submit', preventDefault() {}, stopImmediatePropagation() {} });
  assert.deepEqual(state.goals(), [
    { name: 'selector_start', params: { page_type: 'selector', crop: 'raspberry' } },
    { name: 'selector_no_region_data', params: { page_type: 'selector', crop: 'raspberry', result: 'unmapped_region' } },
    { name: 'selector_error', params: { page_type: 'selector', crop: 'raspberry', result: 'load_error' } },
    { name: 'selector_rule_found', params: { page_type: 'selector', crop: 'raspberry', result: 'verified_rule' } },
    { name: 'selector_complete', params: { page_type: 'selector', crop: 'raspberry', result: 'empty', matches: 0 } }
  ]);
  assert.doesNotMatch(JSON.stringify(state.calls), /PRIVATE_/);
});
