import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shopProducts } from '../shop-products.mjs';
import { varieties } from '../data.mjs';
import { currentShopOffers, shopStockState } from '../shop-model.mjs';
import { shopNameKey } from '../scripts/generate-shop-catalog.mjs';

const dist = process.env.MALINA_TEST_DIST || fileURLToPath(new URL('../../dist/', import.meta.url));
const root = fileURLToPath(new URL('../../', import.meta.url));
const publicProducts = shopProducts.filter(product => !product.canonicalSlug || product.canonicalSlug === product.slug);
const productHtml = product => readFile(join(dist, 'magazin', product.slug, 'index.html'), 'utf8');
const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

async function shopSnapshot() {
  try {
    return JSON.parse(await readFile(join(root, 'db', 'public', 'shop-offers.json'), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

test('каталог сохраняет исходные позиции и публикует одну страницу на товар', () => {
  assert.ok(shopProducts.length >= 298);
  assert.ok(shopProducts.filter(product => product.crop === 'raspberry').length >= 121);
  assert.ok(shopProducts.filter(product => product.crop === 'strawberry').length >= 177);
  assert.equal(new Set(shopProducts.map(product => String(product.id))).size, shopProducts.length);
  assert.equal(new Set(shopProducts.map(product => product.slug)).size, shopProducts.length);
  assert.ok(shopProducts.filter(product => product.canonicalSlug !== product.slug).length >= 138);
  assert.equal(new Set(shopProducts.map(product => product.canonicalSlug || product.slug)).size, publicProducts.length);
  assert.ok(publicProducts.length > 0);
  assert.equal(new Set(publicProducts.map(product => `${product.crop}\0${shopNameKey(product.name, product.source)}`)).size, publicProducts.length);
  const slugs = new Set(shopProducts.map(product => product.slug));
  for (const product of shopProducts) {
    assert.ok(product.name?.trim(), `missing name: ${product.id}`);
    assert.ok(slugs.has(product.canonicalSlug || product.slug), `missing canonical target: ${product.id}`);
  }
});

test('магазин показывает уникальные карточки и убирает повторные упаковки и артикулы', async () => {
  const html = await readFile(join(dist, 'magazin', 'index.html'), 'utf8');
  const sitemap = process.env.SITE_URL ? await readFile(join(dist, 'sitemap.xml'), 'utf8') : '';
  assert.match(html, /<h1>Саженцы малины/);
  assert.equal((html.match(/class="shop-card"/g) || []).length, publicProducts.length);
  const offers = currentShopOffers(await shopSnapshot(), shopProducts);
  const inStockGroups = new Set(shopProducts.filter(product => offers.has(String(product.id))).map(product => product.canonicalSlug));
  assert.equal((html.match(/data-stock="in_stock"/g) || []).length, inStockGroups.size);
  for (const product of publicProducts) {
    assert.ok(html.includes(`href="/magazin/${product.slug}/"`), product.slug);
    if (process.env.SITE_URL) assert.ok(sitemap.includes(`/magazin/${product.slug}/`), `primary missing from sitemap: ${product.slug}`);
  }
  for (const product of shopProducts.filter(item => item.canonicalSlug && item.canonicalSlug !== item.slug)) {
    assert.ok(!html.includes(`href="/magazin/${product.slug}/"`), `duplicate listed: ${product.slug}`);
    if (process.env.SITE_URL) assert.ok(!sitemap.includes(`/magazin/${product.slug}/`), `duplicate in sitemap: ${product.slug}`);
    const redirect = await productHtml(product);
    assert.match(redirect, /name="robots" content="noindex,follow"/, product.slug);
    assert.match(redirect, /<noscript><meta http-equiv="refresh"/);
    assert.match(redirect, /<script defer src="\/assets\/shop-redirect\.js\?v=[a-f0-9]{12}"/);
    assert.match(redirect, /<a data-shop-redirect href=/);
    assert.ok(redirect.includes(`url=/magazin/${product.canonicalSlug}/`), `redirect: ${product.slug}`);
  }
  if (process.env.SITE_URL) {
    assert.match(html, /"@type":"ItemList"/);
    assert.match(html, /"@type":"BreadcrumbList"/);
  }
});

test('поиск по артикулу любой фасовки ведёт к общей карточке', async () => {
  const html = await readFile(join(dist, 'magazin', 'index.html'), 'utf8');
  const cards = new Map([...html.matchAll(/<article class="shop-card"[^>]*>/g)].map(([tag]) => [
    tag.match(/data-shop-canonical="([^"]+)"/)?.[1],
    tag.match(/data-search="([^"]+)"/)?.[1] || ''
  ]));
  assert.equal(cards.size, publicProducts.length);
  for (const product of shopProducts) {
    const canonical = product.canonicalSlug || product.slug;
    assert.ok(cards.get(canonical)?.includes(String(product.id)), `${product.id} missing from ${canonical}`);
  }
});

test('черноплодная малина показывает фото продавца или подходящую локальную иллюстрацию', async () => {
  const detail = await readFile(join(dist, 'magazin', 'malina-blek-dzhevel-67836', 'index.html'), 'utf8');
  const catalog = await readFile(join(dist, 'magazin', 'index.html'), 'utf8');
  const card = catalog.split('data-shop-canonical="malina-blek-dzhevel-67836"')[1]?.split('</article>')[0] || '';
  const suitableImage = /(?:\/assets\/raspberry-black-garden\.webp|\/assets\/shop\/(?:67836|g-237289)\.(?:jpg|png|webp))/;
  assert.match(detail.match(/class="shop-product-image"><img src="([^"]+)"/)?.[1] || '', suitableImage);
  assert.match(card.match(/<img src="([^"]+)"/)?.[1] || '', suitableImage);
  if (detail.includes('property="og:image"')) {
    assert.match(detail, /<meta property="og:image" content="[^"]*\/assets\/raspberry-black-garden\.webp"/);
  }
  assert.ok((await readFile(join(dist, 'assets', 'raspberry-black-garden.webp'))).length > 100_000);
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
    assert.doesNotMatch(html, /<figcaption>[^<]*&lt;a\s/, `escaped photo attribution: ${product.slug}`);
    assert.match(html, /href="\/magazin\/"/, product.slug);
    if (product.merchantUrl) {
      assert.ok(html.includes(`href="${escapeHtml(product.merchantUrl)}"`), `seller source: ${product.slug}`);
    }
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

test('снимок содержит только известные позиции и не раскрывает цену недоступных товаров', async () => {
  const snapshot = await shopSnapshot();
  if (!snapshot?.checkedAt) return;
  assert.ok(snapshot.products.length <= shopProducts.length);
  const knownIds = new Set(shopProducts.map(product => String(product.id)));
  assert.equal(new Set(snapshot.products.map(product => String(product.id))).size, snapshot.products.length);
  for (const product of snapshot.products) assert.ok(knownIds.has(String(product.id)), product.id);
  if (snapshot.checkedAt === '2026-09-28T07:31:51.523Z') {
    assert.equal(snapshot.products.length, 298);
    assert.equal(snapshot.products.filter(product => product.availability === 'in_stock').length, 22);
  }
  for (const product of snapshot.products.filter(product => product.availability === 'out_of_stock')) {
    assert.equal(product.affiliateUrl, undefined, `unavailable affiliate URL: ${product.id}`);
    assert.equal(product.merchantUrl, undefined, `unavailable merchant URL: ${product.id}`);
    assert.equal(product.priceMinor, undefined, `unavailable price: ${product.id}`);
  }
});

test('заказ доступен только для товаров в наличии; остальных подписываем по подтверждённому статусу', async () => {
  const snapshot = await shopSnapshot();
  const current = currentShopOffers(snapshot, shopProducts);
  const index = await readFile(join(dist, 'magazin', 'index.html'), 'utf8');
  const cards = index.match(/<article class="shop-card"[\s\S]*?<\/article>/g) || [];
  for (const product of publicProducts) {
    const html = await productHtml(product);
    const variants = shopProducts.filter(item => (item.canonicalSlug || item.slug) === product.slug);
    const offer = variants.map(item => current.get(String(item.id))).find(Boolean);
    const stock = shopStockState(snapshot, variants, current);
    if (offer) {
      assert.ok(html.includes(`data-affiliate-offer="${offer.id}"`), product.slug);
      assert.ok(html.includes(escapeHtml(offer.name.replace(/^Земляника садовая\s+/iu, 'Клубника '))), `active offer name: ${product.slug}`);
      assert.match(html, /Заказать у продавца/, product.slug);
      assert.match(html, /rel="sponsored nofollow noopener noreferrer"/, product.slug);
      if (process.env.SITE_URL) {
        assert.match(html, /"@type":"Product"/, product.slug);
        assert.match(html, /"@type":"Offer"/, product.slug);
      }
    } else {
      assert.doesNotMatch(html, /data-affiliate-offer=/, product.slug);
      assert.doesNotMatch(html, /Заказать у продавца/, product.slug);
      assert.match(html, stock === 'out_of_stock' ? /Нет в наличии/i : /Наличие уточняется/i, product.slug);
      const card = cards.find(item => item.includes(`href="/magazin/${product.slug}/"`));
      assert.ok(card, `missing card: ${product.slug}`);
      assert.match(card, stock === 'out_of_stock' ? /Нет в наличии/i : /Наличие уточняется/i, `card stock label: ${product.slug}`);
    }
  }
});

test('два продавца одного растения показываются на общей странице с разными ссылками', async () => {
  const offers = currentShopOffers(await shopSnapshot(), shopProducts);
  for (const product of publicProducts) {
    const variants = shopProducts.filter(item => (item.canonicalSlug || item.slug) === product.slug);
    const active = variants.map(item => offers.get(String(item.id))).filter(Boolean);
    if (new Set(active.map(item => item.source)).size < 2) continue;
    const html = await productHtml(product);
    assert.match(html, /ПРЕДЛОЖЕНИЯ ПРОДАВЦОВ/, product.slug);
    assert.match(html, /<h2>Агросемфонд<\/h2>/, product.slug);
    assert.match(html, /<h2>Гаршинка<\/h2>/, product.slug);
    for (const offer of active) {
      assert.ok(html.includes(`data-affiliate-offer="${offer.id}"`), `offer ${offer.id}: ${product.slug}`);
      assert.ok(html.includes(`href="${escapeHtml(offer.affiliateUrl)}"`), `tracking link ${offer.id}: ${product.slug}`);
    }
  }
});

test('страница сорта показывает наличие связанного товара', async () => {
  const snapshot = await shopSnapshot();
  const current = currentShopOffers(snapshot, shopProducts);
  const linked = varieties.filter(variety => publicProducts.some(product => product.cultivarSlug === variety.slug && product.crop === variety.cropKey));
  assert.ok(linked.length > 0);
  for (const variety of linked) {
    const html = await readFile(join(dist, 'sorta', variety.slug, 'index.html'), 'utf8');
    const section = html.match(/<section class="section wrap shop-variety-link">[\s\S]*?<\/section>/)?.[0];
    assert.ok(section, `missing offer on variety: ${variety.slug}`);
    const href = section.match(/href="(\/magazin\/[^\"]+)"/)?.[1];
    const product = publicProducts.find(item => `/magazin/${item.slug}/` === href);
    assert.equal(product?.cultivarSlug, variety.slug, `wrong cultivar: ${variety.slug}`);
    assert.equal(product?.crop, variety.cropKey, `wrong crop: ${variety.slug}`);
    const variants = shopProducts.filter(item => (item.canonicalSlug || item.slug) === product.slug);
    const offer = variants.map(item => current.get(String(item.id))).find(Boolean);
    const stock = shopStockState(snapshot, variants, current);
    const hasAvailableSeedling = shopProducts.some(item => item.cultivarSlug === variety.slug && item.crop === variety.cropKey && current.has(String(item.id)));
    if (hasAvailableSeedling) assert.ok(offer, `available seedling was skipped: ${variety.slug}`);
    const nav = html.match(/<nav class="search-entry-nav"[^>]*>[\s\S]*?<\/nav>/)?.[0];
    assert.ok(nav?.includes(`href="${href}"`), `intro and bottom offers differ: ${variety.slug}`);
    assert.match(section, offer ? /Есть в наличии/ : stock === 'out_of_stock' ? /Нет в наличии/ : /Наличие уточняется/, variety.slug);
  }
});

test('сбой обновления фида не объявляет все товары отсутствующими', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'malina-shop-failure-'));
  try {
    const snapshotPath = join(temp, 'failed-snapshot.json');
    const output = join(temp, 'dist');
    await writeFile(snapshotPath, JSON.stringify({ checkedAt: null, expiresAt: null, products: [] }));
    execFileSync(process.execPath, [join(root, 'site', 'scripts', 'build.mjs')], {
      cwd: root,
      env: { ...process.env, MALINA_BUILD_OUT: output, MALINA_SHOP_SNAPSHOT: snapshotPath },
      stdio: 'pipe'
    });
    const index = await readFile(join(output, 'magazin', 'index.html'), 'utf8');
    const cards = index.match(/<article class="shop-card"[\s\S]*?<\/article>/g) || [];
    assert.equal(cards.length, publicProducts.length);
    assert.ok(cards.every(card => card.includes('data-stock="unknown"') && card.includes('Наличие уточняется') && !card.includes('Нет в наличии')));
    const page = await readFile(join(output, 'magazin', publicProducts[0].slug, 'index.html'), 'utf8');
    assert.match(page, /Наличие уточняется/);
    assert.doesNotMatch(page, /Нет в наличии|data-affiliate-offer=/);
    const linked = publicProducts.find(product => product.cultivarSlug);
    const variety = await readFile(join(output, 'sorta', linked.cultivarSlug, 'index.html'), 'utf8');
    const section = variety.match(/<section class="section wrap shop-variety-link">[\s\S]*?<\/section>/)?.[0];
    assert.match(section, /Наличие уточняется/);
    assert.doesNotMatch(section, /Нет в наличии|Есть в наличии/);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('свежие цены и акции несут срок действия для уже открытой страницы', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'malina-shop-fresh-'));
  try {
    const checkedAt = new Date();
    const expiresAt = new Date(checkedAt.getTime() + 12 * 60 * 60 * 1000);
    const product = shopProducts.find(item => String(item.id) === '67762');
    assert.ok(product);
    const merchantUrl = 'https://agrosemfond.ru/catalog/gusar/';
    const offer = { id: String(product.id), source: 'agrosemfond', name: 'Саженец малины Гусар',
      availability: 'in_stock', priceMinor: 44950, currency: 'RUB', merchantUrl,
      affiliateUrl: `https://rzekl.com/g/abc/?ulp=${encodeURIComponent(merchantUrl)}` };
    const offerPath = join(temp, 'offers.json');
    const couponPath = join(temp, 'coupons.json');
    const output = join(temp, 'dist');
    await writeFile(offerPath, JSON.stringify({ checkedAt: checkedAt.toISOString(), expiresAt: expiresAt.toISOString(), products: [offer] }));
    await writeFile(couponPath, JSON.stringify({ checkedAt: checkedAt.toISOString(), expiresAt: expiresAt.toISOString(), coupons: [
      { id: 'garshinka-851479', source: 'garshinka', seller: 'Гаршинка', title: '5000 бонусов за подписку на рассылку',
        description: 'Бонусы за подписку на рассылку магазина.', affiliateUrl: 'https://codeaven.com/g/offer?i=123', dateEnd: expiresAt.toISOString() }
    ] }));
    execFileSync(process.execPath, [join(root, 'site', 'scripts', 'build.mjs')], {
      cwd: root, env: { ...process.env, MALINA_BUILD_OUT: output, MALINA_SHOP_SNAPSHOT: offerPath, MALINA_COUPONS_SNAPSHOT: couponPath }, stdio: 'pipe'
    });
    const catalog = await readFile(join(output, 'magazin', 'index.html'), 'utf8');
    const page = await readFile(join(output, 'magazin', product.canonicalSlug || product.slug, 'index.html'), 'utf8');
    assert.match(catalog, /data-shop-offers-expires="[^"]+"/);
    assert.match(catalog, /data-shop-live-price[^>]*>449,50/);
    assert.match(page, /data-shop-live-order/);
    assert.match(page, /data-shop-order-navigation/);
    assert.match(catalog, /data-shop-coupon-dates="[^"]+"/);
    assert.match(catalog, /data-shop-coupon-banner/);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('распроданный товар ведёт к тому же сорту, затем к другому сорту или подбору', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'malina-shop-next-'));
  try {
    const checkedAt = new Date();
    const expiresAt = new Date(checkedAt.getTime() + 6 * 60 * 60 * 1000);
    const active = [
      { id: 'g-300164', source: 'garshinka', name: 'Малина Геракл ремонтантная красная (лицензионная)',
        merchantUrl: 'https://www.garshinka.ru/product/gerakl', affiliateHost: 'codeaven.com' },
      { id: '67762', source: 'agrosemfond', name: 'Малина крупноплодная Гусар',
        merchantUrl: 'https://agrosemfond.ru/catalog/gusar/', affiliateHost: 'rzekl.com' }
    ].map(item => ({
      id: item.id, source: item.source, name: item.name, availability: 'in_stock',
      priceMinor: 44950, currency: 'RUB', merchantUrl: item.merchantUrl,
      affiliateUrl: `https://${item.affiliateHost}/g/abc/?ulp=${encodeURIComponent(item.merchantUrl)}`
    }));
    const unavailableGroups = ['gerakl-sazhenec', 'zheltyy-gigant-sazhenec', 'aziya-sazhenec', 'malina-meteor-73583'];
    const unavailable = shopProducts
      .filter(item => unavailableGroups.includes(item.canonicalSlug || item.slug))
      .map(item => ({ id: item.id, source: item.source, name: item.name, availability: 'out_of_stock' }));
    const snapshotPath = join(temp, 'offers.json');
    const output = join(temp, 'dist');
    await writeFile(snapshotPath, JSON.stringify({ checkedAt: checkedAt.toISOString(), expiresAt: expiresAt.toISOString(), products: [...active, ...unavailable] }));
    execFileSync(process.execPath, [join(root, 'site', 'scripts', 'build.mjs')], {
      cwd: root, env: { ...process.env, MALINA_BUILD_OUT: output, MALINA_SHOP_SNAPSHOT: snapshotPath }, stdio: 'pipe'
    });
    const readPage = slug => readFile(join(output, 'magazin', slug, 'index.html'), 'utf8');
    assert.match(await readFile(join(output, 'assets', 'shop-navigation.mjs'), 'utf8'), /export function shopNavigationContext/);
    const sameCultivar = await readPage('gerakl-sazhenec');
    const variety = await readFile(join(output, 'sorta', 'gerakl', 'index.html'), 'utf8');
    const intro = variety.match(/<nav class="search-entry-nav"[^>]*>[\s\S]*?<\/nav>/)?.[0];
    const bottom = variety.match(/<section class="section wrap shop-variety-link">[\s\S]*?<\/section>/)?.[0];
    assert.match(intro, /href="\/magazin\/tovar-g-300164\/"/);
    assert.match(bottom, /href="\/magazin\/tovar-g-300164\/"/);
    assert.match(bottom, /Есть в наличии/);
    assert.match(sameCultivar, /data-shop-next-step="same_cultivar"/);
    assert.match(sameCultivar, /href="\/magazin\/tovar-g-300164\/"/);
    assert.match(sameCultivar, /data-shop-order-navigation><a[^>]*href="\/magazin\/tovar-g-300164\/">Посмотреть другое предложение/);
    assert.doesNotMatch(sameCultivar, /data-affiliate-offer=/);
    assert.match(sameCultivar, /<figcaption>Фото сорта<\/figcaption>/);
    assert.match(sameCultivar, /class="photo-attribution">Фото сорта · <a href="https:\/\/biosel/);
    const yellow = await readPage('zheltyy-gigant-sazhenec');
    assert.match(yellow, /data-shop-next-step="picker"/);
    assert.match(yellow, /data-shop-order-navigation><a[^>]*href="\/podbor\/\?crop=raspberry"/);
    assert.doesNotMatch(yellow, /data-affiliate-offer=/);
    const similar = await readPage('malina-meteor-73583');
    assert.match(similar, /data-shop-next-step="other_cultivars"/);
    assert.match(similar, /data-shop-order-navigation><a[^>]*href="#alternativy">Посмотреть похожие сорта/);
    assert.match(similar, /id="alternativy"/);
    assert.match(similar, /href="\/magazin\/gusar-sazhenec\/"/);
    const picker = await readPage('aziya-sazhenec');
    assert.match(picker, /data-shop-next-step="picker"/);
    assert.match(picker, /href="\/podbor\/\?crop=strawberry"/);
    assert.match(picker, /href="\/sorta\/\?crop=strawberry"/);
    assert.doesNotMatch(picker, /data-affiliate-offer=/);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('товарная страница ведёт к подбору города без повторяющихся оговорок', async () => {
  for (const product of publicProducts) {
    const html = await productHtml(product);
    assert.match(html, new RegExp(`<section id="regiony">[\\s\\S]*?href="/podbor/\\?crop=${product.crop}"`), `city picker: ${product.slug}`);
    assert.doesNotMatch(html, /нет сверенных сведений о регионах допуска|Сейчас заказ этой позиции недоступен|Наличие может измениться при следующем обновлении/i, product.slug);
    assert.doesNotMatch(html, /<dd>(?:|—)<\/dd>/, `empty variety fact: ${product.slug}`);
    if (!product.lead) assert.doesNotMatch(html, /class="shop-product-lead"/, `generic hero lead: ${product.slug}`);
  }
});
