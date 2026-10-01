import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

test('официальные допуски остаются видимыми при отсутствии местных испытаний', async () => {
  const source = await readFile(new URL('../assets/verified-selector.js', import.meta.url), 'utf8');
  const listeners = new Map();
  const element = () => ({
    children: [],
    hidden: false,
    textContent: '',
    dataset: {},
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
    querySelectorAll() { return []; },
    addEventListener(type, listener) { listeners.set(type, listener); }
  });
  const form = element();
  form.elements = { region: { value: 'Тульская область' } };
  const status = element();
  const results = element();
  const output = element();
  const pickerResults = element();
  const admissionStatus = element();
  const nodes = new Map([
    ['#picker-form', form], ['#verified-status', status], ['#verified-results', results],
    ['#picker-output', output], ['#picker-results', pickerResults],
    ['#picker-admission-status', admissionStatus]
  ]);
  const catalog = {
    schema_version: 1,
    regions: [{ name_ru: 'Тульская область', code: 'tula', admission_region_name: 'Центральный', admission_region_number: 3 }],
    cultivars: [{ slug: 'gusar', canonical_name: 'Гусар', crop_slug: 'raspberry', admissions: [{
      admission_region_number: 3, edition_as_of: '2024', registry_entry_code: '123'
    }] }]
  };
  const context = {
    document: {
      documentElement: { dataset: {} },
      querySelector: selector => nodes.get(selector),
      querySelectorAll: () => [],
      createElement: element
    },
    location: { origin: 'https://example.test' },
    URL,
    FormData: class { get(name) { return name === 'region' ? 'Тульская область' : name === 'crop' ? 'raspberry' : null; } },
    fetch: async () => ({ ok: true, text: async () => JSON.stringify(catalog) }),
    __import: async () => ({ default: async () => {}, select_varieties: () => JSON.stringify({ total: 0 }) })
  };
  runInNewContext(source.replace(/\bimport\s*\(/g, '__import('), context);
  await listeners.get('submit')({ preventDefault() {} });

  assert.match(status.textContent, /Мы нашли 1 сорт в региональном списке/);
  assert.equal(results.children.length, 1);
  assert.equal(results.children[0].children[0].textContent, 'Гусар');
  assert.equal(results.children[0].children[2].href, '/sorta/gusar/?region=%D0%A2%D1%83%D0%BB%D1%8C%D1%81%D0%BA%D0%B0%D1%8F+%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C');

  await listeners.get('picker:location-change')();
  assert.equal(results.children.length, 0);
  assert.equal(status.textContent, 'Выберите регион и нажмите «Показать сорта».');
  assert.equal(admissionStatus.hidden, true);
});

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

async function pickerHarness({ crop = 'raspberry', fetchCatalog, importEngine } = {}) {
  const element = (classes = []) => ({
    children: [], parent: null, hidden: false, textContent: '', dataset: {}, listeners: new Map(),
    classList: { contains: value => classes.includes(value) },
    get nextElementSibling() { return this.parent?.children[this.parent.children.indexOf(this) + 1] || null; },
    append(...children) {
      for (const child of children) {
        if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1);
        child.parent = this;
        this.children.push(child);
      }
    },
    after(...children) {
      const parent = this.parent;
      for (const child of children) {
        if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1);
        child.parent = parent;
      }
      parent.children.splice(parent.children.indexOf(this) + 1, 0, ...children);
    },
    replaceChildren(...children) {
      for (const child of this.children) child.parent = null;
      this.children = [];
      this.append(...children);
    },
    querySelector(selector) { return selector === '.picker-admission' ? this.badge : null; },
    querySelectorAll(selector) {
      return selector === '.picker-group-heading' ? this.children.filter(child => child.classList.contains('picker-group-heading')) : [];
    },
    addEventListener(type, listener) {
      const listeners = this.listeners.get(type) || [];
      listeners.push(listener);
      this.listeners.set(type, listeners);
    },
    dispatchEvent(event) {
      for (const listener of this.listeners.get(event.type) || []) listener(event);
    }
  });
  const form = element();
  form.elements = { region: { value: 'Тульская область' }, crop: { value: crop } };
  const status = element();
  const results = element();
  const output = element();
  const pickerResults = element();
  const admissionStatus = element();
  const cultivars = [
    { slug: 'polka', canonical_name: 'Полька', crop_slug: 'raspberry', admissions: [] },
    { slug: 'gusar', canonical_name: 'Гусар', crop_slug: 'raspberry', admissions: [{ admission_region_number: 3 }] },
    { slug: 'aziya', canonical_name: 'Азия', crop_slug: 'strawberry', admissions: [] },
    { slug: 'festivalnaya', canonical_name: 'Фестивальная', crop_slug: 'strawberry', admissions: [{ admission_region_number: 3 }] }
  ];
  const cards = cultivars.map(cultivar => {
    const card = element(['variety-card']);
    card.dataset = { cultivarSlug: cultivar.slug, pickerVisible: String(cultivar.crop_slug === crop) };
    card.badge = element();
    card.badge.hidden = true;
    return card;
  });
  const heading = element(['picker-group-heading']);
  pickerResults.append(heading, ...cards.filter(card => card.dataset.pickerVisible === 'true'), ...cards.filter(card => card.dataset.pickerVisible === 'false'));
  const catalog = {
    schema_version: 1,
    regions: [{ name_ru: 'Тульская область', code: 'tula', admission_region_name: 'Центральный', admission_region_number: 3 }],
    cultivars
  };
  const nodes = new Map([
    ['#picker-form', form], ['#verified-status', status], ['#verified-results', results],
    ['#picker-output', output], ['#picker-results', pickerResults], ['#picker-admission-status', admissionStatus]
  ]);
  const context = {
    document: {
      documentElement: { dataset: {} },
      querySelector: selector => nodes.get(selector),
      querySelectorAll: () => cards,
      createElement: () => element()
    },
    location: { origin: 'https://example.test' }, URL,
    Event: class { constructor(type) { this.type = type; } },
    FormData: class {
      constructor(form) { this.values = Object.fromEntries(Object.entries(form.elements).map(([key, field]) => [key, field.value])); }
      get(name) { return this.values[name] || null; }
    },
    fetch: fetchCatalog || (async () => ({ ok: true, text: async () => JSON.stringify(catalog) })),
    __import: importEngine || (async () => ({ default: async () => {}, select_varieties: () => JSON.stringify({ total: 0 }) }))
  };
  const source = await readFile(new URL('../assets/verified-selector.js', import.meta.url), 'utf8');
  runInNewContext(source.replace(/\bimport\s*\(/g, '__import('), context);
  return {
    form, status, results, output, pickerResults, admissionStatus, cards, catalog,
    submit: () => form.listeners.get('submit')[0]({ preventDefault() {} }),
    emitResults: () => output.dispatchEvent({ type: 'picker:results' }),
    changeLocation: () => form.dispatchEvent({ type: 'picker:location-change' })
  };
}

for (const [crop, admittedSlug, otherSlug] of [
  ['raspberry', 'gusar', 'polka'], ['strawberry', 'festivalnaya', 'aziya']
]) {
  test(`региональные сорта ${crop} выходят первыми после готовности основной выдачи`, async () => {
    const picker = await pickerHarness({ crop });
    let orderChanges = 0;
    picker.output.addEventListener('picker:order-change', () => { orderChanges += 1; });
    await picker.submit();
    assert.equal(picker.admissionStatus.hidden, true);
    picker.emitResults();
    const visibleOrder = picker.pickerResults.children.filter(card => card.dataset.pickerVisible === 'true').map(card => card.dataset.cultivarSlug);
    assert.deepEqual(visibleOrder, [admittedSlug, otherSlug]);
    assert.equal(orderChanges, 1);
    assert.equal(picker.admissionStatus.hidden, false);
    assert.match(picker.admissionStatus.textContent, /Мы нашли 1 сорт в региональном списке/);
    assert.equal(picker.cards.find(card => card.dataset.cultivarSlug === admittedSlug).badge.hidden, false);
    assert.equal(picker.cards.find(card => card.dataset.cultivarSlug === otherSlug).badge.hidden, true);
    assert.equal(picker.results.children.length, 1);
    assert.equal(picker.results.children[0].children[0].textContent, crop === 'raspberry' ? 'Гусар' : 'Фестивальная');
  });

  test(`региональные сорта ${crop} сохраняются в основной выдаче при ошибке WASM`, async () => {
    const importing = deferred();
    const picker = await pickerHarness({ crop, importEngine: () => importing.promise });
    const pending = picker.submit();
    await new Promise(resolve => setImmediate(resolve));
    picker.emitResults();
    importing.resolve({ default: async () => { throw new Error('WASM unavailable'); } });
    await pending;
    assert.equal(picker.status.dataset.outcome, 'verified_rule');
    assert.match(picker.status.textContent, /Мы нашли 1 сорт в региональном списке/);
    assert.equal(picker.results.children.length, 1);
    assert.equal(picker.admissionStatus.hidden, false);
    assert.equal(picker.pickerResults.children.find(card => card.dataset.pickerVisible === 'true').dataset.cultivarSlug, admittedSlug);
    assert.equal(picker.cards.find(card => card.dataset.cultivarSlug === admittedSlug).badge.hidden, false);
  });

  test(`региональные сорта ${crop} сортируются и при готовности основной выдачи раньше каталога`, async () => {
    const loading = deferred();
    const picker = await pickerHarness({ crop, fetchCatalog: () => loading.promise });
    const pending = picker.submit();
    picker.emitResults();
    assert.equal(picker.admissionStatus.hidden, true);
    loading.resolve({ ok: true, text: async () => JSON.stringify(picker.catalog) });
    await pending;
    assert.equal(picker.admissionStatus.hidden, false);
    assert.equal(picker.pickerResults.children.find(card => card.dataset.pickerVisible === 'true').dataset.cultivarSlug, admittedSlug);
  });
}

test('смена места во время загрузки каталога отменяет прежние региональные результаты', async () => {
  const loading = deferred();
  const picker = await pickerHarness({ fetchCatalog: () => loading.promise });
  const pending = picker.submit();
  picker.form.elements.region.value = 'Калужская область';
  picker.changeLocation();
  loading.resolve({ ok: true, text: async () => JSON.stringify(picker.catalog) });
  await pending;
  picker.emitResults();
  assert.equal(picker.results.children.length, 0);
  assert.equal(picker.status.textContent, 'Выберите регион и нажмите «Показать сорта».');
  assert.equal(picker.admissionStatus.hidden, true);
  assert.ok(picker.cards.every(card => card.badge.hidden));
});

test('смена места во время загрузки WASM очищает уже найденные допуски и не возвращает старые наблюдения', async () => {
  const importing = deferred();
  const picker = await pickerHarness({ importEngine: () => importing.promise });
  const pending = picker.submit();
  await new Promise(resolve => setImmediate(resolve));
  picker.emitResults();
  assert.equal(picker.results.children.length, 1);
  assert.equal(picker.admissionStatus.hidden, false);
  picker.form.elements.region.value = 'Калужская область';
  picker.changeLocation();
  importing.resolve({
    default: async () => {},
    select_varieties: () => JSON.stringify({ total: 1, matches: [{ slug: 'gusar', canonical_name: 'Гусар', reasons: [] }] })
  });
  await pending;
  picker.emitResults();
  assert.equal(picker.results.children.length, 0);
  assert.equal(picker.status.textContent, 'Выберите регион и нажмите «Показать сорта».');
  assert.equal(picker.admissionStatus.hidden, true);
  assert.ok(picker.cards.every(card => card.badge.hidden));
});
