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

  assert.match(status.textContent, /Мы нашли 1 сорт из официального списка/);
  assert.equal(results.children.length, 1);
  assert.equal(results.children[0].children[0].textContent, 'Гусар');
  assert.equal(results.children[0].children[2].href, '/sorta/gusar/?region=%D0%A2%D1%83%D0%BB%D1%8C%D1%81%D0%BA%D0%B0%D1%8F+%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C');

  await listeners.get('picker:location-change')();
  assert.equal(results.children.length, 0);
  assert.equal(status.textContent, 'Выберите регион и нажмите «Показать сорта».');
  assert.equal(admissionStatus.hidden, true);
});
