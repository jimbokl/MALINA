import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './admitad-feed.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const raspberryPrefix = 'Плодовые/Малина/';
const strawberryPrefix = 'Саженцы земляники/';
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

export function buildCatalogManifest(csv, curatedProducts = []) {
  const curatedById = new Map(curatedProducts.map(product => [String(product.id), product]));
  const selected = parseCsv(csv).filter(row => row.categoryId.startsWith(raspberryPrefix) || row.categoryId.startsWith(strawberryPrefix));
  const ids = new Set();
  const names = new Map();
  const groups = new Map();
  for (const row of selected) {
    if (!/^\d+$/.test(row.id) || !row.name.trim() || row.name.length > 250 || ids.has(row.id) || !merchantUrl(row)) {
      throw new Error(`Invalid or duplicate catalog ID ${row.id}`);
    }
    ids.add(row.id);
    const name = row.name.trim().normalize('NFKC').toLocaleLowerCase('ru');
    names.set(name, (names.get(name) || 0) + 1);
    const key = `${name}\u0000${merchantUrl(row)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const primaryIds = new Map([...groups].map(([key, rows]) => [key,
    rows.sort((left, right) => Number(right.available === 'true') - Number(left.available === 'true') ||
      Number(left.id) - Number(right.id))[0].id
  ]));
  const slugById = new Map(selected.map(row => [row.id, curatedById.get(row.id)?.slug || slugify(row.name, row.id)]));
  const products = selected.map(row => {
    const crop = row.categoryId.startsWith(raspberryPrefix) ? 'raspberry' : 'strawberry';
    const curated = curatedById.get(row.id);
    if (curated && curated.crop !== crop) throw new Error(`Curated crop differs for ${row.id}`);
    const nameKey = row.name.trim().normalize('NFKC').toLocaleLowerCase('ru');
    const groupKey = `${nameKey}\u0000${merchantUrl(row)}`;
    const duplicate = groups.get(groupKey).length > 1;
    return {
      id: row.id,
      slug: slugById.get(row.id),
      name: row.name.trim(),
      expectedName: curated?.expectedName || row.name.trim(),
      crop,
      categoryId: row.categoryId,
      merchantUrl: merchantUrl(row),
      description: row.description?.trim() || '',
      duplicateName: names.get(nameKey) > 1,
      canonicalSlug: slugById.get(primaryIds.get(groupKey)),
      variantLabel: duplicate ? `Артикул ${row.id}` : null,
      cultivarSlug: curated?.cultivarSlug || null
    };
  });
  if (new Set(products.map(product => product.slug)).size !== products.length) {
    throw new Error('Duplicate shop catalog slugs');
  }
  return products.sort((left, right) => left.crop.localeCompare(right.crop) ||
    left.name.localeCompare(right.name, 'ru') || Number(left.id) - Number(right.id));
}

async function main() {
  const source = process.argv[2];
  if (!source) throw new Error('Usage: node site/scripts/generate-shop-catalog.mjs <feed.csv> [output.json]');
  const output = process.argv[3] || join(root, 'site', 'shop-catalog.json');
  const csv = await readFile(source, 'utf8');
  // The existing editorial entries are read from the source module only after
  // its committed manifest exists; the six stable slugs are kept here for the
  // initial migration and subsequent regeneration.
  const curated = [
    { id: '67762', slug: 'gusar-sazhenec', crop: 'raspberry', expectedName: 'Гусар', cultivarSlug: 'gusar' },
    { id: '71131', slug: 'gerakl-sazhenec', crop: 'raspberry', expectedName: 'Геракл', cultivarSlug: 'gerakl' },
    { id: '71157', slug: 'rubinovoe-ozherele-sazhenec', crop: 'raspberry', expectedName: 'Рубиновое ожерелье', cultivarSlug: 'rubinovoe-ozherele' },
    { id: '71544', slug: 'zheltyy-gigant-sazhenec', crop: 'raspberry', expectedName: 'Жёлтый гигант', cultivarSlug: 'zheltyy-gigant' },
    { id: '68612', slug: 'aziya-sazhenec', crop: 'strawberry', expectedName: 'Азия', cultivarSlug: 'aziya' },
    { id: '68587', slug: 'kleri-sazhenec', crop: 'strawberry', expectedName: 'Клери', cultivarSlug: 'kleri' }
  ];
  const products = buildCatalogManifest(csv, curated);
  await writeFile(output, `${JSON.stringify(products, null, 2)}\n`);
  process.stdout.write(`Shop catalog: ${products.length} products (${products.filter(product => product.crop === 'raspberry').length} raspberry, ${products.filter(product => product.crop === 'strawberry').length} strawberry)\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
