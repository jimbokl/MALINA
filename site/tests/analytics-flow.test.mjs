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

function harness({ path, counter = '', base = '', nodes = new Map(), referrer = '', storage = new Map() }) {
  const calls = [];
  const appended = [];
  const location = new URL(`https://example.test${path}`);
  const document = new Element();
  const window = new Element({ ym: (...args) => calls.push(args) });
  let reloads = 0;
  window.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  window.location = { reload: () => { reloads += 1; } };
  document.documentElement = { dataset: { ymCounter: counter, siteBase: base, shopOffersExpires: '2999-01-01T00:00:00Z' } };
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
  return { calls, goals, appended, document, window, observers, storage, reloads: () => reloads };
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

test('review conversion records accepted status and reply kind without counting rejection', () => {
  const state = harness({ path: '/otzyvy/', counter: '12345' });
  state.window.malinaTrackReviewSubmitted('published', true);
  state.window.malinaTrackReviewSubmitted('pending_human_review', false);
  state.window.malinaTrackReviewSubmitted('rejected', false);
  state.window.malinaTrackReviewSubmitted('PRIVATE_STATUS', false);
  assert.deepEqual(state.goals(), [
    { name: 'review_submitted', params: { page_type: 'other', kind: 'reply', publication_state: 'published' } },
    { name: 'review_submitted', params: { page_type: 'other', kind: 'review', publication_state: 'pending_human_review' } }
  ]);
  assert.doesNotMatch(JSON.stringify(state.calls), /PRIVATE_STATUS/);
});

test('cookie notice opt out persists and prevents Metrica on the next page', async () => {
  const disable = new Element();
  const notice = new Element();
  notice.querySelector = selector => selector.includes('disable') ? disable : null;
  const storage = new Map();
  const nodes = new Map([['#cookie-notice', notice]]);
  const first = harness({ path: '/', counter: '12345', nodes, storage });
  assert.equal(first.appended.length, 1);
  await disable.dispatchEvent({ type: 'click' });
  assert.equal(storage.get('malina:analytics-choice'), 'disabled');
  assert.equal(first.reloads(), 1);
  const next = harness({ path: '/sorta/polka/', counter: '12345', nodes, storage });
  assert.equal(next.appended.length, 0);
  assert.deepEqual(next.calls, []);
  assert.equal(notice.hidden, true);
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

test('expired offer click refreshes the page state without navigation or conversion', async () => {
  for (const expiry of ['2020-01-01T00:00:00Z', undefined, '', 'invalid']) {
  for (const type of ['click', 'auxclick']) {
    const state = harness({ path: '/magazin/malina-gusar/', counter: '12345' });
    state.document.documentElement.dataset.shopOffersExpires = expiry;
    let prevented = false;
    await state.document.dispatchEvent({
      type, button: type === 'auxclick' ? 1 : 0,
      target: target(new Set(['[data-affiliate-offer]']), { dataset: { affiliateOffer: '67762', cultivar: 'gusar' } }),
      preventDefault() { prevented = true; }
    });
    assert.equal(prevented, true);
    assert.deepEqual(state.goals(), []);
  }
  }
});

test('affiliate clicks record canonical page, seller, product and placement once for left or middle click', async () => {
  const canonical = new Element({ getAttribute: () => 'https://example.test/magazin/malina-gusar/' });
  const state = harness({ path: '/magazin/malina-gusar/?city=PRIVATE_CITY#PRIVATE_HASH', counter: '12345', nodes: new Map([['link[rel="canonical"]', canonical]]) });
  const offer = target(new Set(['[data-affiliate-offer]']), { dataset: {
    affiliateOffer: 'g-67762', cultivar: 'gusar', sellerId: 'garshinka', productId: 'malina-gusar', ctaPlacement: 'shop_offer'
  }, href: 'https://seller.test/?token=PRIVATE_TOKEN' });
  await state.document.dispatchEvent({ type: 'click', button: 0, target: offer });
  await state.document.dispatchEvent({ type: 'auxclick', button: 1, target: offer });
  await state.document.dispatchEvent({ type: 'auxclick', button: 2, target: offer });
  await state.document.dispatchEvent({ type: 'click', button: 1, target: offer });
  await state.document.dispatchEvent({ type: 'click', button: 0, defaultPrevented: true, target: offer });
  assert.equal(state.goals().length, 2);
  for (const goal of state.goals()) assert.deepEqual(goal, { name: 'affiliate_click', params: {
    page_type: 'other', offer_id: 'g-67762', cultivar: 'gusar', seller_id: 'garshinka', product_id: 'malina-gusar',
    page_path: '/magazin/malina-gusar/', cta_placement: 'shop_offer'
  } });
  assert.doesNotMatch(JSON.stringify(state.calls), /PRIVATE_/);
});

test('untrusted event context is omitted and a cultivar shop step has its own goal', async () => {
  const state = harness({ path: '/sorta/polka/?PRIVATE_QUERY', counter: '12345', nodes: new Map([
    ['link[rel="canonical"]', new Element({ getAttribute: () => 'https://other.test/PRIVATE_PATH/' })]
  ]) });
  await state.document.dispatchEvent({ type: 'click', target: target(new Set(['[data-affiliate-offer]']), { dataset: {
    affiliateOffer: '67762', sellerId: 'PRIVATE_SELLER', productId: 'PRIVATE_PRODUCT', ctaPlacement: 'PRIVATE_PLACEMENT'
  } }) });
  await state.document.dispatchEvent({ type: 'click', target: target(new Set(['[data-cultivar-to-shop]']), { dataset: {
    cultivarToShop: 'polka', ctaPlacement: 'cultivar_intro'
  } }) });
  const goals = state.goals().filter(goal => goal.name !== 'cultivar_view');
  assert.deepEqual(goals, [
    { name: 'affiliate_click', params: { page_type: 'cultivar', offer_id: '67762' } },
    { name: 'cultivar_to_shop', params: { page_type: 'cultivar', cultivar: 'polka', cta_placement: 'cultivar_intro' } }
  ]);
  assert.doesNotMatch(JSON.stringify(goals), /PRIVATE_/);
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
  status.dataset.outcome = 'unmapped_region';
  state.observers[0].callback();
  state.observers[0].callback();
  status.dataset.outcome = 'load_error';
  state.observers[0].callback();
  status.dataset.outcome = 'verified_rule';
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


test('feed offers cannot bypass snapshot expiry; catalog observations use their own deadline', async () => {
  const cases = [
    { feed: '2020-01-01T00:00:00Z', own: '2999-01-01T00:00:00Z', allowed: false },
    { feed: '2999-01-01T00:00:00Z', own: 'invalid', allowed: false },
    { feed: undefined, own: '2999-01-01T00:00:00Z', source: 'catalog', allowed: true },
    { feed: '2999-01-01T00:00:00Z', own: undefined, source: 'catalog', allowed: false }
  ];
  for (const item of cases) {
    const state = harness({ path: '/sorta/gusar/', counter: '12345' });
    state.document.documentElement.dataset.shopOffersExpires = item.feed;
    let prevented = false;
    await state.document.dispatchEvent({ type: 'click', button: 0,
      target: target(new Set(['[data-affiliate-offer]']), { dataset: {
        affiliateOffer: 'offer-1', offerExpires: item.own, offerSource: item.source
      } }), preventDefault() { prevented = true; }
    });
    assert.equal(prevented, !item.allowed);
    assert.equal(state.goals().filter(goal => goal.name === 'affiliate_click').length, item.allowed ? 1 : 0);
  }
});
