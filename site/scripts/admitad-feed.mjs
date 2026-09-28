import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const requiredColumns = ['available', 'categoryId', 'currencyId', 'id', 'name', 'picture', 'price', 'url'];
const maxFeedBytes = 60 * 1024 * 1024;
const freshnessMs = 36 * 60 * 60 * 1000;

export function parseCsv(input) {
  const text = input.replace(/^\uFEFF/, '');
  const records = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field === '') {
      quoted = true;
    } else if (char === ';') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some(value => value !== '')) records.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (field || row.length) {
    row.push(field.replace(/\r$/, ''));
    records.push(row);
  }
  const [headers, ...values] = records;
  if (!headers || requiredColumns.some(column => !headers.includes(column))) {
    throw new Error('Admitad CSV columns are missing');
  }
  if (new Set(headers).size !== headers.length) throw new Error('Duplicate CSV columns');
  return values.map((cells, index) => {
    if (cells.length !== headers.length) throw new Error(`Malformed CSV row ${index + 2}`);
    return Object.fromEntries(headers.map((header, position) => [header, cells[position]]));
  });
}

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

function normalizedName(value) {
  return value.normalize('NFKC').toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').replace(/\s+/g, ' ').trim();
}

function matchesIdentity(row, curated) {
  const categoryPrefix = curated.crop === 'raspberry' ? 'Плодовые/Малина/'
    : curated.crop === 'strawberry' ? 'Саженцы земляники/' : null;
  if (!categoryPrefix || !row.categoryId.startsWith(categoryPrefix)) return false;
  if (typeof curated.expectedName !== 'string' || !curated.expectedName.trim()) return false;
  const name = normalizedName(row.name);
  const expected = normalizedName(curated.expectedName);
  const position = name.indexOf(expected);
  if (position < 0) return false;
  const before = position > 0 ? name[position - 1] : '';
  const after = name[position + expected.length] || '';
  return !/[\p{L}\p{N}]/u.test(before) && !/[\p{L}\p{N}]/u.test(after);
}

function publicProduct(row, curated) {
  if (row.available !== 'true' || !/^\d+$/.test(row.id)) return null;
  if (!matchesIdentity(row, curated)) return null;
  const affiliate = httpsUrl(row.url, 'rzekl.com');
  const merchant = affiliate && httpsUrl(affiliate.searchParams.get('ulp'), 'agrosemfond.ru');
  if (!merchant) return null;
  const picture = httpsUrl(row.picture, 'agrosemfond.ru');
  const price = Number(row.price.replace(',', '.'));
  if (!Number.isFinite(price) || price <= 0 || price > 10_000_000 ||
      !/^\d+(?:[.,]\d{1,2})?$/.test(row.price) || row.currencyId !== 'RUR') return null;
  const priceMinor = Math.round(price * 100);
  const name = row.name.trim();
  if (!name || name.length > 250) return null;
  return {
    id: row.id,
    name,
    priceMinor,
    currency: 'RUB',
    availability: 'in_stock',
    merchantUrl: merchant.href,
    affiliateUrl: affiliate.href,
    imageUrl: picture?.href || null
  };
}

export function buildSnapshot(csv, curatedProducts, now = new Date()) {
  const allowed = new Map(curatedProducts.map(product => [String(product.id), product]));
  if (allowed.size !== curatedProducts.length) throw new Error('Duplicate curated product IDs');
  const selected = new Map();
  const seen = new Set();
  for (const row of parseCsv(csv)) {
    if (!allowed.has(row.id)) continue;
    if (seen.has(row.id)) {
      selected.delete(row.id); // An ambiguous ID cannot be published.
      allowed.delete(row.id);
      continue;
    }
    seen.add(row.id);
    const product = publicProduct(row, allowed.get(row.id));
    if (product) selected.set(row.id, product);
  }
  return {
    checkedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + freshnessMs).toISOString(),
    products: curatedProducts.flatMap(product => selected.get(String(product.id)) || [])
  };
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

async function downloadImage(url, fetcher = fetch) {
  const response = await fetcher(url, { redirect: 'manual', signal: AbortSignal.timeout(15_000) });
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
  for (const product of products) {
    if (!product.imageUrl) continue;
    try {
      const { bytes, type } = await downloadImage(product.imageUrl, fetcher);
      const filename = `${product.id}.${type}`;
      await writeFile(join(directory, filename), bytes);
      product.imagePath = `/assets/shop/${filename}`;
      current.add(filename);
    } catch {
      // The editorial page can use an illustration, never a missing product photo.
    }
  }
  for (const filename of await readdir(directory)) {
    if (/^\d+\.(?:jpg|png|webp)$/.test(filename) && !current.has(filename)) {
      await rm(join(directory, filename));
    }
  }
}

async function main() {
  const { shopProducts } = await import('../shop-products.mjs');
  const output = process.env.SHOP_OFFERS_PATH || join(root, 'db', 'public', 'shop-offers.json');
  try {
    if (!process.env.ADMITAD_FEED_URL) throw new Error('ADMITAD_FEED_URL is unset');
    const feed = await fetchFeed(process.env.ADMITAD_FEED_URL);
    const snapshot = buildSnapshot(feed, shopProducts);
    await cacheImages(snapshot.products, join(root, 'db', 'public', 'shop-images'));
    await writeSnapshot(output, snapshot);
    process.stdout.write(`Admitad snapshot: ${snapshot.products.length} curated available products\n`);
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
