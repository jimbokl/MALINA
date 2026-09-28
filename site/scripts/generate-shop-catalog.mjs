import { readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './admitad-csv.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const raspberryPrefix = 'Плодовые/Малина/';
const strawberryPrefix = 'Саженцы земляники/';
export const curatedCatalogProducts = [
  { id: '67762', slug: 'gusar-sazhenec', crop: 'raspberry', expectedName: 'Гусар', cultivarSlug: 'gusar' },
  { id: '71131', slug: 'gerakl-sazhenec', crop: 'raspberry', expectedName: 'Геракл', cultivarSlug: 'gerakl' },
  { id: '71157', slug: 'rubinovoe-ozherele-sazhenec', crop: 'raspberry', expectedName: 'Рубиновое ожерелье', cultivarSlug: 'rubinovoe-ozherele' },
  { id: '71544', slug: 'zheltyy-gigant-sazhenec', crop: 'raspberry', expectedName: 'Жёлтый гигант', cultivarSlug: 'zheltyy-gigant' },
  { id: '68612', slug: 'aziya-sazhenec', crop: 'strawberry', expectedName: 'Азия', cultivarSlug: 'aziya' },
  { id: '68587', slug: 'kleri-sazhenec', crop: 'strawberry', expectedName: 'Клери', cultivarSlug: 'kleri' }
];
const cyrillic = new Map(Object.entries({
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y',
  ь: '', э: 'e', ю: 'yu', я: 'ya'
}));

function slugify(name, id) {
  const latin = [...name.toLocaleLowerCase('ru')].map(char => cyrillic.get(char) ?? char).join('');
  const base = latin.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70).replace(/-$/g, '');
  return `${base || 'tovar'}-${id}`;
}

function merchantUrl(row) {
  try {
    const tracked = new URL(row.url);
    if (tracked.protocol !== 'https:' || tracked.hostname !== 'rzekl.com') return null;
    const merchant = new URL(tracked.searchParams.get('ulp'));
    if (merchant.protocol !== 'https:' || merchant.hostname !== 'agrosemfond.ru' ||
        merchant.username || merchant.password || merchant.port) return null;
    return merchant.href;
  } catch { return null; }
}

// Feed entries for the same plant may differ only by pack size or pot code.
// Keep every SKU in the manifest, but publish one landing page per plant name.
export function shopNameKey(name) {
  let key = name.trim().normalize('NFKC').toLocaleLowerCase('ru').replaceAll('ё', 'е').replace(/\s+/g, ' ');
  let previous;
  do {
    previous = key;
    key = key.replace(/\s+\d+\s*шт\.?\s*(?:[рp]\s*\d+)?\s*$/iu, '')
      .replace(/\s+asf\s*$/iu, '').trim();
  } while (key !== previous);
  // Both labels refer to the verified cultivar Кимберли in our catalog.
  if (key === 'земляника садовая вима кимберли') return 'земляника садовая кимберли';
  // The feed repeats the same Изобильная description under two categories.
  if (key === 'малина ремонтантная изобильная') return 'малина изобильная';
  return key;
}

export function buildCatalogManifest(csv, curatedProducts = [], previousProducts = [], { stableNewSlugs = false } = {}) {
  const curatedById = new Map(curatedProducts.map(product => [String(product.id), product]));
  const previousById = new Map(previousProducts.map(product => [String(product.id), product]));
  if (previousById.size !== previousProducts.length) throw new Error('Duplicate previous catalog IDs');
  const incoming = parseCsv(csv).filter(row => row.categoryId.startsWith(raspberryPrefix) || row.categoryId.startsWith(strawberryPrefix));
  const ids = new Set();
  const ambiguousIds = new Set();
  const selectedById = new Map();
  for (const row of incoming) {
    if (!/^\d+$/.test(row.id) || !row.name.trim() || row.name.length > 250) continue;
    if (ids.has(row.id)) {
      ambiguousIds.add(row.id);
      selectedById.delete(row.id);
      continue;
    }
    ids.add(row.id);
    if (ambiguousIds.has(row.id)) continue;
    const previous = previousById.get(row.id);
    const crop = row.categoryId.startsWith(raspberryPrefix) ? 'raspberry' : 'strawberry';
    // A reused seller ID must not silently replace an existing variety page.
    if (previous && (previous.crop !== crop || shopNameKey(previous.name) !== shopNameKey(row.name))) continue;
    selectedById.set(row.id, { ...row, crop, merchantUrl: merchantUrl(row) });
  }
  for (const previous of previousProducts) {
    if (!selectedById.has(String(previous.id))) {
      selectedById.set(String(previous.id), { ...previous, merchantUrl: null, carriedOver: true });
    }
  }
  const selected = [...selectedById.values()];
  const names = new Map();
  const groups = new Map();
  for (const row of selected) {
    const name = shopNameKey(row.name);
    names.set(name, (names.get(name) || 0) + 1);
    const key = `${row.crop}\u0000${name}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const slugById = new Map(selected.map(row => [row.id, curatedById.get(row.id)?.slug || previousById.get(row.id)?.slug ||
    (stableNewSlugs ? `tovar-${row.id}` : slugify(row.name, row.id))]));
  const primaryIds = new Map([...groups].map(([key, rows]) => {
    const curated = rows.find(row => curatedById.has(row.id));
    const bareName = row => shopNameKey(row.name) === row.name.trim().normalize('NFKC').toLocaleLowerCase('ru').replaceAll('ё', 'е');
    const byStableName = (left, right) => Number(!bareName(left)) - Number(!bareName(right)) || Number(left.id) - Number(right.id);
    const oldCanonical = rows.filter(row => previousById.get(row.id)?.canonicalSlug === slugById.get(row.id))
      .sort(byStableName)[0];
    const bare = rows.filter(bareName).sort(byStableName)[0];
    return [key, (curated || oldCanonical || bare || [...rows].sort((left, right) => Number(left.id) - Number(right.id))[0]).id];
  }));
  const products = selected.map(row => {
    const crop = row.crop;
    const curated = curatedById.get(row.id);
    if (curated && curated.crop !== crop) throw new Error(`Curated crop differs for ${row.id}`);
    const nameKey = shopNameKey(row.name);
    const groupKey = `${crop}\u0000${nameKey}`;
    const duplicate = groups.get(groupKey).length > 1;
    return {
      id: row.id,
      slug: slugById.get(row.id),
      name: row.name.trim(),
      expectedName: curated?.expectedName || (row.carriedOver ? row.expectedName : row.name.trim()),
      crop,
      categoryId: row.categoryId,
      merchantUrl: row.merchantUrl,
      description: row.description?.trim() || '',
      duplicateName: names.get(nameKey) > 1,
      canonicalSlug: slugById.get(primaryIds.get(groupKey)),
      variantLabel: duplicate ? `Артикул ${row.id}` : null,
      cultivarSlug: curated?.cultivarSlug || previousById.get(row.id)?.cultivarSlug || null
    };
  });
  if (new Set(products.map(product => product.slug)).size !== products.length) {
    throw new Error('Duplicate shop catalog slugs');
  }
  return products.sort((left, right) => left.crop.localeCompare(right.crop) ||
    left.name.localeCompare(right.name, 'ru') || Number(left.id) - Number(right.id));
}

export async function writeCatalogManifest(path, products) {
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(products, null, 2)}\n`);
  await rename(temporary, path);
}

async function main() {
  const source = process.argv[2];
  if (!source) throw new Error('Usage: node site/scripts/generate-shop-catalog.mjs <feed.csv> [output.json]');
  const output = process.argv[3] || join(root, 'site', 'shop-catalog.json');
  const csv = await readFile(source, 'utf8');
  const previous = await readFile(output, 'utf8').then(JSON.parse).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const products = buildCatalogManifest(csv, curatedCatalogProducts, previous);
  await writeCatalogManifest(output, products);
  process.stdout.write(`Shop catalog: ${products.length} products (${products.filter(product => product.crop === 'raspberry').length} raspberry, ${products.filter(product => product.crop === 'strawberry').length} strawberry)\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
