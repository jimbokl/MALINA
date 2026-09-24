import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../dist/', import.meta.url));
const routes = ['/', '/malina/', '/klubnika/', '/sorta/', '/podbor/', '/guide/', '/about/',
  '/sorta/polka/', '/sorta/joan-j/', '/sorta/cambridge-favourite/', '/sorta/elan/'];

test('каждая публичная страница содержит самостоятельный HTML и рабочие внутренние ссылки', async () => {
  const titles = new Set();
  for (const route of routes) {
    const html = await readFile(join(root, route, 'index.html'), 'utf8');
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.ok(title, `нет title: ${route}`);
    assert.ok(!titles.has(title), `повторяется title: ${title}`);
    titles.add(title);
    assert.match(html, /<meta name="description" content="[^"]+">/);
    assert.match(html, /<h1[ >]/);
    assert.ok(html.length > 2500, `страница пуста без JavaScript: ${route}`);
    for (const [, href] of html.matchAll(/href="(\/[^"]*)"/g)) {
      const base = html.match(/data-site-base="([^"]*)"/)?.[1] || '';
      const localHref = href.split('#')[0].split('?')[0];
      if (base) assert.ok(localHref.startsWith(`${base}/`), `ссылка без SITE_BASE: ${href}`);
      const path = base ? localHref.slice(base.length) : localHref;
      if (!path) continue;
      const file = path.endsWith('/') ? join(root, path, 'index.html') : join(root, path);
      await assert.doesNotReject(access(file), `битая ссылка ${href} на ${route}`);
    }
  }
});

test('карточки показывают источник и границы применимости данных', async () => {
  for (const route of routes.filter(route => route.startsWith('/sorta/') && route !== '/sorta/')) {
    const html = await readFile(join(root, route, 'index.html'), 'utf8');
    assert.match(html, /https:\/\/www\.rhs\.org\.uk\/plants\//);
    assert.match(html, /не испытание сорта в регионах России/);
  }
});

test('подбор запрашивает регион и честно отмечает отсутствие региональных правил', async () => {
  const html = await readFile(join(root, '/podbor/', 'index.html'), 'utf8');
  const js = await readFile(join(root, '/assets/site.js'), 'utf8');
  assert.match(html, /name="region"[^>]*required/);
  assert.match(html, /региональные правила подбора ещё не опубликованы/);
  assert.match(js, /не региональная рекомендация/);
  assert.match(html, /id="verified-form"/);
  assert.match(html, /id="verified-region"/);
  assert.match(html, /assets\/verified-selector\.js/);
});

test('публичный JSON подключается к собранному WASM и не выдумывает рекомендации', async () => {
  const catalog = await readFile(join(root, '/data/catalog.json'), 'utf8');
  const data = JSON.parse(catalog);
  assert.equal(data.schema_version, 1);
  assert.equal(data.cultivars.length, 4);
  assert.ok(data.cultivars.every(cultivar => cultivar.recommendations.length === 0));
  const wasm = await readFile(join(root, '/assets/selector/malina_selector_bg.wasm'));
  assert.equal(wasm.subarray(0, 4).toString('hex'), '0061736d');
  const { initSync, select_varieties } = await import('../../dist/assets/selector/malina_selector.js');
  initSync({ module: wasm });
  const result = JSON.parse(select_varieties(catalog, JSON.stringify({ region_code: 'kaliningrad-oblast' })));
  assert.equal(result.total, 0);
  assert.deepEqual(result.matches, []);
  assert.equal(result.error, undefined);
});
