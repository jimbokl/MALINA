import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { varieties } from '../data.mjs';
import { shopProducts } from '../shop-products.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const origin = 'http://malinaklubnika.ru';
const graphs = html => [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  .map(match => JSON.parse(match[1])['@graph']);
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

test('разметка различает справку о сорте, видимый товар и устаревшее предложение', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'malina-schema-'));
  try {
    const imagesDir = join(temp, 'shop-images');
    await mkdir(imagesDir);
    await copyFile(join(root, 'site', 'assets', 'raspberry-garden.webp'), join(imagesDir, '67762.webp'));
    const checkedAt = new Date();
    const expiresAt = new Date(checkedAt.getTime() + 6 * 60 * 60 * 1000);
    const merchantUrl = 'https://agrosemfond.ru/catalog/gusar/';
    const affiliateUrl = `https://rzekl.com/g/schema-test/?ulp=${encodeURIComponent(merchantUrl)}`;
    const unavailable = shopProducts.filter(product => (product.canonicalSlug || product.slug) === 'aziya-sazhenec');
    assert.ok(unavailable.length > 0);
    const snapshot = { checkedAt: checkedAt.toISOString(), expiresAt: expiresAt.toISOString(), products: [
      { id: '67762', source: 'agrosemfond', name: 'Саженец малины Гусар', availability: 'in_stock',
        priceMinor: 44950, currency: 'RUB', merchantUrl, affiliateUrl, imagePath: '/assets/shop/67762.webp' },
      ...unavailable.map(product => ({ id: product.id, source: product.source, availability: 'out_of_stock' }))
    ] };
    const snapshotPath = join(temp, 'offers.json');
    const output = join(temp, 'dist');
    await writeFile(snapshotPath, JSON.stringify(snapshot));
    execFileSync(process.execPath, [join(root, 'site', 'scripts', 'build.mjs')], {
      cwd: root, env: { ...process.env, SITE_URL: origin, SITE_BASE: '/', MALINA_BUILD_OUT: output,
        MALINA_SHOP_SNAPSHOT: snapshotPath, MALINA_SHOP_IMAGES_DIR: imagesDir }, stdio: 'pipe'
    });

    for (const variety of varieties) {
      const html = await readFile(join(output, 'sorta', variety.slug, 'index.html'), 'utf8');
      const [graph] = graphs(html);
      assert.ok(graph, variety.slug);
      assert.equal(graph[0]['@type'], 'WebPage', variety.slug);
      assert.equal(graph[0].about.name, `${variety.crop}: ${variety.name}`, variety.slug);
      assert.ok(graph.every(node => !['Product', 'Review', 'AggregateRating'].includes(node['@type'])), variety.slug);
    }

    const availableHtml = await readFile(join(output, 'magazin', 'gusar-sazhenec', 'index.html'), 'utf8');
    const [availableGraph] = graphs(availableHtml);
    const page = availableGraph.find(node => node['@type'] === 'WebPage');
    const product = availableGraph.find(node => node['@type'] === 'Product');
    assert.equal(page.mainEntity['@id'], product['@id']);
    assert.equal(product.url, `${origin}/magazin/gusar-sazhenec/`);
    assert.equal(product.image, `${origin}/assets/shop/67762.webp`);
    assert.match(availableHtml, /class="shop-product-image"><img src="\/assets\/shop\/67762\.webp"/);
    assert.equal(product.offers.length, 1);
    assert.equal(product.offers[0].url, affiliateUrl);
    assert.equal(product.offers[0].price, '449.50');
    assert.equal(product.offers[0].priceCurrency, 'RUB');
    assert.equal(product.offers[0].availability, 'https://schema.org/InStock');
    assert.equal(product.offers[0].seller.name, 'Агросемфонд');
    assert.ok(availableHtml.includes(`href="${escapeHtml(affiliateUrl)}"`));
    assert.match(availableHtml, /449,50/);
    assert.ok(availableGraph.every(node => !['Review', 'AggregateRating'].includes(node['@type'])));

    const unavailableHtml = await readFile(join(output, 'magazin', 'aziya-sazhenec', 'index.html'), 'utf8');
    const [unavailableGraph] = graphs(unavailableHtml);
    assert.match(unavailableHtml, /Нет в наличии/);
    assert.ok(unavailableGraph.every(node => !['Product', 'Offer', 'Review', 'AggregateRating'].includes(node['@type'])));
    assert.equal(unavailableGraph.find(node => node['@type'] === 'WebPage')?.mainEntity, undefined);

    snapshot.checkedAt = new Date(checkedAt.getTime() - 24 * 60 * 60 * 1000).toISOString();
    snapshot.expiresAt = new Date(checkedAt.getTime() - 18 * 60 * 60 * 1000).toISOString();
    await writeFile(snapshotPath, JSON.stringify(snapshot));
    const staleOutput = join(temp, 'stale');
    execFileSync(process.execPath, [join(root, 'site', 'scripts', 'build.mjs')], {
      cwd: root, env: { ...process.env, SITE_URL: origin, SITE_BASE: '/', MALINA_BUILD_OUT: staleOutput,
        MALINA_SHOP_SNAPSHOT: snapshotPath, MALINA_SHOP_IMAGES_DIR: imagesDir }, stdio: 'pipe'
    });
    const staleHtml = await readFile(join(staleOutput, 'magazin', 'gusar-sazhenec', 'index.html'), 'utf8');
    const [staleGraph] = graphs(staleHtml);
    assert.ok(staleGraph.every(node => !['Product', 'Offer'].includes(node['@type'])));
    assert.doesNotMatch(staleHtml, /data-affiliate-offer=/);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
