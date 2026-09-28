import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shopProducts } from '../shop-products.mjs';
import { currentShopOffers } from '../shop-model.mjs';

const dist = process.env.MALINA_TEST_DIST || fileURLToPath(new URL('../../dist/', import.meta.url));
const root = fileURLToPath(new URL('../../', import.meta.url));

test('магазин состоит из карточек с переходом на отдельную страницу каждого товара', async () => {
  const html = await readFile(join(dist, 'magazin', 'index.html'), 'utf8');
  assert.match(html, /<h1>Саженцы малины/);
  assert.equal((html.match(/class="shop-card"/g) || []).length, shopProducts.length);
  for (const product of shopProducts) {
    assert.match(html, new RegExp(`href="/magazin/${product.slug}/"`));
  }
  if (process.env.SITE_URL) {
    assert.match(html, /"@type":"ItemList"/);
    assert.match(html, /"@type":"BreadcrumbList"/);
  }
});

test('каждая товарная страница содержит SEO-метаданные, посадку, регионы, источники и переход к отзывам', async () => {
  const titles = new Set();
  for (const product of shopProducts) {
    const html = await readFile(join(dist, 'magazin', product.slug, 'index.html'), 'utf8');
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(title?.includes(product.expectedName), product.slug);
    assert.ok(description?.includes(product.expectedName), product.slug);
    assert.ok(!titles.has(title), `duplicate title: ${product.slug}`);
    titles.add(title);
    assert.match(html, /<h1>[^<]+<\/h1>/);
    assert.match(html, /id="regiony"/);
    assert.match(html, /id="posadka"/);
    assert.match(html, /class="shop-sources"/);
    assert.match(html, /class="shop-product-image"><img src="\/assets\//);
    assert.match(html, new RegExp(`href="/sorta/${product.cultivarSlug}/"`));
    assert.match(html, /href="\/magazin\/"/);
    if (process.env.SITE_URL) {
      assert.ok(html.includes(`<link rel="canonical" href="${process.env.SITE_URL}/magazin/${product.slug}/">`));
      assert.match(html, /"@type":"BreadcrumbList"/);
    }
  }
});

test('покупка доступна только у товаров из свежего проверенного снимка фида', async () => {
  const snapshot = JSON.parse(await readFile(join(root, 'db', 'public', 'shop-offers.json'), 'utf8').catch(() => 'null'));
  const current = currentShopOffers(snapshot, shopProducts);
  for (const product of shopProducts) {
    const html = await readFile(join(dist, 'magazin', product.slug, 'index.html'), 'utf8');
    if (current.has(product.id)) {
      assert.match(html, new RegExp(`data-affiliate-offer="${product.id}"`));
      assert.match(html, /Заказать у продавца/);
      assert.match(html, /rel="sponsored nofollow noopener noreferrer"/);
      if (process.env.SITE_URL) {
        assert.match(html, /"@type":"Product"/);
        assert.match(html, /"@type":"Offer"/);
      }
    } else {
      assert.doesNotMatch(html, /data-affiliate-offer=/);
      assert.match(html, /Предложение сейчас недоступно/);
    }
  }
});
