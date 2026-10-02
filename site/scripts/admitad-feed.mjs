import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './admitad-csv.mjs';
import { admitadSources, sourceProductId } from './admitad-sources.mjs';
import { buildCatalogManifest, curatedCatalogProducts, writeCatalogManifest } from './generate-shop-catalog.mjs';
import { matchesExpectedName } from '../shop-identity.mjs';

export { parseCsv } from './admitad-csv.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const maxFeedBytes = 60 * 1024 * 1024;
const freshnessMs = 12 * 60 * 60 * 1000;

function httpsUrl(value, allowedHost) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== allowedHost ||
        url.username || url.password || url.port) return null;
    return url;
  } catch {
    return null;
  }
}

function matchesIdentity(row, curated, source) {
  if (source.crop(row.categoryId, row.name) !== curated.crop) return false;
  return matchesExpectedName(row.name, curated.expectedName);
}

function publicProduct(row, curated, source) {
  if (!/^\d+$/.test(row.id)) return null;
  if (!matchesIdentity(row, curated, source)) return null;
  const name = row.name.trim();
  if (!name || name.length > 250) return null;
  const picture = httpsUrl(row.picture, source.imageHost);
  const identity = {
    id: sourceProductId(source, row.id),
    source: source.id,
    name,
    imageUrl: picture?.href || null
  };
  if (row.available === 'false') return { ...identity, availability: 'out_of_stock' };
  if (row.available !== 'true') return null;
  const affiliate = httpsUrl(row.url, source.affiliateHost);
  const merchant = affiliate && httpsUrl(affiliate.searchParams.get('ulp'), source.merchantHost);
  if (!merchant) return null;
  const price = Number(row.price.replace(',', '.'));
  if (!Number.isFinite(price) || price <= 0 || price > 10_000_000 ||
      !/^\d+(?:[.,]\d{1,2})?$/.test(row.price) || row.currencyId !== 'RUR') return null;
  const priceMinor = Math.round(price * 100);
  return {
    ...identity,
    priceMinor,
    currency: 'RUB',
    availability: 'in_stock',
    merchantUrl: merchant.href,
    affiliateUrl: affiliate.href
  };
}

export function buildSnapshot(csv, curatedProducts, now = new Date(), sourceId = 'agrosemfond') {
  const source = admitadSources[sourceId];
  if (!source) throw new Error('Unknown Admitad source');
  const allowed = new Map(curatedProducts.map(product => [String(product.id), product]));
  if (allowed.size !== curatedProducts.length) throw new Error('Duplicate curated product IDs');
  const selected = new Map();
  const seen = new Set();
  for (const row of parseCsv(csv)) {
    const id = sourceProductId(source, row.id);
    if (!allowed.has(id)) continue;
    if (seen.has(id)) {
      selected.delete(id); // An ambiguous ID cannot be published.
      allowed.delete(id);
      continue;
    }
    seen.add(id);
    const product = publicProduct(row, allowed.get(id), source);
    if (product) selected.set(id, product);
  }
  return {
    checkedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + freshnessMs).toISOString(),
    products: curatedProducts.flatMap(product => selected.get(String(product.id)) || [])
  };
}

export function buildFeedRefresh(feeds, previousCatalog, now = new Date(), curatedProducts = curatedCatalogProducts) {
  let catalog = previousCatalog;
  const products = [];
  const sources = [];
  for (const feed of feeds) {
    try {
      const nextCatalog = buildCatalogManifest(feed.csv, curatedProducts, catalog, { stableNewSlugs: true, source: feed.source });
      const nextSnapshot = buildSnapshot(feed.csv, nextCatalog.filter(product => product.source === feed.source), now, feed.source);
      catalog = nextCatalog;
      products.push(...nextSnapshot.products);
      sources.push({ source: feed.source, ok: true, productCount: nextSnapshot.products.length,
        availableCount: nextSnapshot.products.filter(product => product.availability === 'in_stock').length });
    } catch {
      // Catalog validation belongs to the source, just like download/CSV failures.
      sources.push({ source: feed.source, ok: false });
    }
  }
  const hasFreshSource = sources.some(source => source.ok);
  const snapshot = {
    checkedAt: hasFreshSource ? now.toISOString() : null,
    expiresAt: hasFreshSource ? new Date(now.getTime() + freshnessMs).toISOString() : null,
    products
  };
  return { catalog, snapshot, sources };
}

export async function fetchFeed(feedUrl, fetcher = fetch) {
  const url = httpsUrl(feedUrl, 'export.admitad.com');
  if (!url) throw new Error('ADMITAD_FEED_URL must use HTTPS export.admitad.com');
  const response = await fetcher(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(45_000),
    headers: { Accept: 'text/csv' }
  });
  if (!response.ok || response.status >= 300) throw new Error(`Admitad returned HTTP ${response.status}`);
  const size = Number(response.headers.get('content-length'));
  if (Number.isFinite(size) && size > maxFeedBytes) throw new Error('Admitad CSV exceeds size limit');
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > maxFeedBytes) throw new Error('Admitad CSV exceeds size limit');
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export async function writeSnapshot(path, snapshot) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(snapshot)}\n`, { mode: 0o600 });
  await rename(temporary, path);
}

async function downloadImage(url, fetcher = fetch, signal = AbortSignal.timeout(15_000)) {
  const response = await fetcher(url, { redirect: 'manual', signal });
  if (!response.ok || response.status >= 300) throw new Error(`Image HTTP ${response.status}`);
  const size = Number(response.headers.get('content-length'));
  if (Number.isFinite(size) && size > 5_000_000) throw new Error('Image exceeds size limit');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > 5_000_000) throw new Error('Image exceeds size limit');
  const type = bytes[0] === 0xff && bytes[1] === 0xd8 ? 'jpg'
    : bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 ? 'png'
    : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP' ? 'webp' : null;
  if (!type) throw new Error('Unsupported product image');
  return { bytes, type };
}

export async function cacheImages(products, directory, fetcher = fetch) {
  await mkdir(directory, { recursive: true });
  const current = new Set();
  const globalDeadline = AbortSignal.timeout(45_000);
  const groups = new Map();
  for (const product of products) {
    if (product.imageUrl) {
      if (!groups.has(product.imageUrl)) groups.set(product.imageUrl, []);
      groups.get(product.imageUrl).push(product);
    }
  }
  const entries = [...groups];
  let next = 0;
  async function worker() {
    while (next < entries.length && !globalDeadline.aborted) {
      const [url, groupedProducts] = entries[next++];
      try {
        const signal = AbortSignal.any([globalDeadline, AbortSignal.timeout(6_000)]);
        const { bytes, type } = await downloadImage(url, fetcher, signal);
        await Promise.all(groupedProducts.map(async product => {
          const filename = `${product.id}.${type}`;
          await writeFile(join(directory, filename), bytes);
          product.imagePath = `/assets/shop/${filename}`;
          current.add(filename);
        }));
      } catch {
        // A valid remote URL remains in the snapshot for a browser fallback.
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(12, entries.length) }, worker));
  for (const filename of await readdir(directory)) {
    if (/^(?:g-)?\d+\.(?:jpg|png|webp)$/.test(filename) && !current.has(filename)) {
      await rm(join(directory, filename));
    }
  }
}

async function main() {
  const catalogPath = join(root, 'site', 'shop-catalog.json');
  const output = process.env.SHOP_OFFERS_PATH || join(root, 'db', 'public', 'shop-offers.json');
  try {
    const feeds = [];
    for (const [source, envName] of [['agrosemfond', 'ADMITAD_FEED_URL'], ['garshinka', 'ADMITAD_FEED_URL_GARSHINKA']]) {
      try {
        if (!process.env[envName]) throw new Error(`${envName} is unset`);
        const csv = await fetchFeed(process.env[envName]);
        parseCsv(csv); // Reject a broken source without withdrawing healthy sellers.
        feeds.push({ source, csv });
      } catch (error) {
        process.stderr.write(`Admitad ${source} refresh failed: ${/^Admitad returned HTTP \d{3}$/.test(error.message) ? error.message : 'feed unavailable'}\n`);
      }
    }
    if (!feeds.length) throw new Error('No Admitad feeds available');
    const previousCatalog = JSON.parse(await readFile(catalogPath, 'utf8'));
    const { catalog, snapshot, sources } = buildFeedRefresh(feeds, previousCatalog);
    for (const source of sources.filter(source => !source.ok)) {
      process.stderr.write(`Admitad ${source.source} refresh failed: catalog validation failed\n`);
    }
    await cacheImages(snapshot.products, join(root, 'db', 'public', 'shop-images'));
    await writeCatalogManifest(catalogPath, catalog);
    await writeSnapshot(output, snapshot);
    const sourceCounts = sources.filter(source => source.ok).map(source => `${source.source}: ${source.productCount} products, ${source.availableCount} available`);
    process.stdout.write(`Admitad snapshot: ${catalog.length} catalog products; ${sourceCounts.join('; ')}\n`);
  } catch (error) {
    // A failed refresh must withdraw price and outbound ordering links.
    await writeSnapshot(output, { checkedAt: null, expiresAt: null, products: [] });
    await cacheImages([], join(root, 'db', 'public', 'shop-images'));
    const safeReason = /^(ADMITAD_FEED_URL is unset|ADMITAD_FEED_URL must use HTTPS export\.admitad\.com|Admitad returned HTTP \d{3}|Admitad CSV exceeds size limit|Admitad CSV columns are missing|Duplicate CSV columns|Malformed CSV row \d+|Unclosed CSV quote|Duplicate curated product IDs)$/.test(error.message)
      ? error.message : 'fetch or decoding failed';
    process.stderr.write(`Admitad snapshot withdrawn: ${safeReason}\n`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
