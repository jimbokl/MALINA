import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shopProducts } from '../shop-products.mjs';
import { currentShopOffers } from '../shop-model.mjs';
import { shopNameKey } from '../scripts/generate-shop-catalog.mjs';

const dist = process.env.MALINA_TEST_DIST || fileURLToPath(new URL('../../dist/', import.meta.url));
const root = fileURLToPath(new URL('../../', import.meta.url));
const publicProducts = shopProducts.filter(product => !product.canonicalSlug || product.canonicalSlug === product.slug);
const productHtml = product => readFile(join(dist, 'magazin', product.slug, 'index.html'), 'utf8');

async function shopSnapshot() {
  try {
    return JSON.parse(await readFile(join(root, 'db', 'public', 'shop-offers.json'), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

test('фид содержит 298 позиций, публичный каталог — 166 уникальных товаров', () => {
  assert.equal(shopProducts.length, 298);
  assert.equal(shopProducts.filter(product => product.crop === 'raspberry').length, 121);
  assert.equal(shopProducts.filter(product => product.crop === 'strawberry').length, 177);
  assert.equal(new Set(shopProducts.map(product => String(product.id))).size, 298);
  assert.equal(new Set(shopProducts.map(product => product.slug)).size, 298);
  assert.equal(shopProducts.filter(product => product.canonicalSlug !== product.slug).length, 132);
  assert.equal(new Set(shopProducts.map(product => product.canonicalSlug || product.slug)).size, 166);
  assert.equal(publicProducts.length, 166);
  assert.equal(new Set(publicProducts.map(product => `${product.crop}\0${shopNameKey(product.name)}`)).size, 166);
  const slugs = new Set(shopProducts.map(product => product.slug));
  for (const product of shopProducts) {
    assert.ok(product.name?.trim(), `missing name: ${product.id}`);
    assert.ok(slugs.has(product.canonicalSlug || product.slug), `missing canonical target: ${product.id}`);
  }
});

test('магазин показывает 166 карточек и убирает повторные упаковки и артикулы', async () => {
  const html = await readFile(join(dist, 'magazin', 'index.html'), 'utf8');
  const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
  assert.match(html, /<h1>Саженцы малины/);
  assert.equal((html.match(/class="shop-card"/g) || []).length, 166);
  const offers = currentShopOffers(await shopSnapshot(), shopProducts);
  const inStockGroups = new Set(shopProducts.filter(product => offers.has(String(product.id))).map(product => product.canonicalSlug));
  assert.equal((html.match(/data-stock="in_stock"/g) || []).length, inStockGroups.size);
  for (const product of publicProducts) {
    assert.ok(html.includes(`href="/magazin/${product.slug}/"`), product.slug);
    assert.ok(sitemap.includes(`/magazin/${product.slug}/`), `primary missing from sitemap: ${product.slug}`);
  }
  for (const product of shopProducts.filter(item => item.canonicalSlug && item.canonicalSlug !== item.slug)) {
    assert.ok(!html.includes(`href="/magazin/${product.slug}/"`), `duplicate listed: ${product.slug}`);
    assert.ok(!sitemap.includes(`/magazin/${product.slug}/`), `duplicate in sitemap: ${product.slug}`);
    const redirect = await productHtml(product);
    assert.match(redirect, /name="robots" content="noindex,follow"/, product.slug);
    assert.ok(redirect.includes(`url=/magazin/${product.canonicalSlug}/`), `redirect: ${product.slug}`);
  }
  if (process.env.SITE_URL) {
    assert.match(html, /"@type":"ItemList"/);
    assert.match(html, /"@type":"BreadcrumbList"/);
  }
});

test('все публичные товарные страницы имеют уникальный заголовок и свой canonical', async () => {
  const titles = new Set();
  for (const product of publicProducts) {
    const html = await productHtml(product);
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(title?.trim(), `missing title: ${product.slug}`);
    assert.ok(description?.trim(), `missing description: ${product.slug}`);
    assert.ok(!titles.has(title), `duplicate title: ${product.slug}`);
    titles.add(title);
    assert.match(html, /<h1>[^<]+(?:<small[^>]*>[^<]+<\/small>)?<\/h1>/, product.slug);
    assert.match(html, /class="shop-product-image"/, product.slug);
    assert.match(html, /href="\/magazin\/"/, product.slug);
    if (product.cultivarSlug) {
      assert.ok(html.includes(`href="/sorta/${product.cultivarSlug}/"`), product.slug);
    }
    if (process.env.SITE_URL) {
      const canonical = `${process.env.SITE_URL.replace(/\/$/, '')}/magazin/${product.slug}/`;
      assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `canonical: ${product.slug}`);
      assert.match(html, /"@type":"BreadcrumbList"/, product.slug);
    }
  }
});

test('исходный снимок содержит 298 позиций, из них 22 в наличии', async () => {
  const snapshot = await shopSnapshot();
  if (!snapshot?.checkedAt?.startsWith('2026-09-28')) return;
  assert.equal(snapshot.products.length, 298);
  assert.deepEqual(new Set(snapshot.products.map(product => String(product.id))), new Set(shopProducts.map(product => String(product.id))));
  assert.equal(snapshot.products.filter(product => product.availability === 'in_stock').length, 22);
  assert.equal(snapshot.products.filter(product => product.availability === 'out_of_stock').length, 276);
  for (const product of snapshot.products.filter(product => product.availability === 'out_of_stock')) {
    assert.equal(product.affiliateUrl, undefined, `unavailable affiliate URL: ${product.id}`);
    assert.equal(product.merchantUrl, undefined, `unavailable merchant URL: ${product.id}`);
    assert.equal(product.priceMinor, undefined, `unavailable price: ${product.id}`);
  }
});

test('заказ доступен только для товаров в наличии; остальные подписаны «Нет в наличии»', async () => {
  const snapshot = await shopSnapshot();
  const current = currentShopOffers(snapshot, shopProducts);
  const index = await readFile(join(dist, 'magazin', 'index.html'), 'utf8');
  const cards = index.match(/<article class="shop-card"[\s\S]*?<\/article>/g) || [];
  for (const product of publicProducts) {
    const html = await productHtml(product);
    const offer = current.get(String(product.id)) || shopProducts.filter(item => item.canonicalSlug === product.slug).map(item => current.get(String(item.id))).find(Boolean);
    if (offer) {
      assert.ok(html.includes(`data-affiliate-offer="${offer.id}"`), product.slug);
      assert.match(html, /Заказать у продавца/, product.slug);
      assert.match(html, /rel="sponsored nofollow noopener noreferrer"/, product.slug);
      if (process.env.SITE_URL) {
        assert.match(html, /"@type":"Product"/, product.slug);
        assert.match(html, /"@type":"Offer"/, product.slug);
      }
    } else {
      assert.doesNotMatch(html, /data-affiliate-offer=/, product.slug);
      assert.doesNotMatch(html, /Заказать у продавца/, product.slug);
      assert.match(html, /Нет в наличии/i, product.slug);
      const card = cards.find(item => item.includes(`href="/magazin/${product.slug}/"`));
      assert.ok(card, `missing card: ${product.slug}`);
      assert.match(card, /Нет в наличии/i, `card stock label: ${product.slug}`);
    }
  }
});
