import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { varieties } from '../data.mjs';
import { programmaticCultivars } from '../seo-programmatic.mjs';
import { shopProducts } from '../shop-products.mjs';
import { articles } from '../editorial.mjs';
import { articleEntryNavigation } from '../search-entry.mjs';

test('every cultivar has early, script-free links to existing answer sections and exact shop identity', async () => {
  for (const item of [...varieties, ...programmaticCultivars(varieties)]) {
    const html = await readFile(new URL(`../../dist/sorta/${item.slug}/index.html`, import.meta.url), 'utf8');
    const nav = /<nav class="search-entry-nav"[^>]*>(.*?)<\/nav>/.exec(html);
    assert.ok(nav, item.slug);
    assert.ok(nav.index > html.indexOf('<h1>'), item.slug);
    assert.ok(nav.index < html.indexOf('id="seo-opisanie"'), item.slug);
    for (const [, id] of nav[1].matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${id}"`), `${item.slug}: ${id}`);
    const href = /href="(\/magazin\/[^\"]+)"/.exec(nav[1])?.[1];
    if (href) {
      const product = shopProducts.find(product => `/magazin/${product.slug}/` === href);
      assert.equal(product?.cultivarSlug, item.slug, item.slug);
      assert.equal(product?.crop, item.cropKey, item.slug);
    }
  }
});

test('Tibetan first screen answers botanical identity and offers real section links before illustration', async () => {
  const article = articles.find(item => item.slug === 'tibetskaya-malina-kakoe-rastenie');
  const html = await readFile(new URL(`../../dist/zhurnal/${article.slug}/index.html`, import.meta.url), 'utf8');
  const hero = html.indexOf('<figure class="media-hero-image">');
  const nav = articleEntryNavigation(article);
  assert.ok(html.indexOf(nav) < hero);
  assert.ok(html.indexOf(article.takeaway) < hero);
  assert.equal(html.split(article.takeaway).length, 2);
  for (const link of article.entryLinks) assert.ok(html.includes(`id="section-${link.section}"`));
  assert.doesNotMatch(nav, /\/magazin\//);
  assert.throws(() => articleEntryNavigation({ ...article, entryLinks: [{ section: 99, label: 'Invalid' }] }));
});
