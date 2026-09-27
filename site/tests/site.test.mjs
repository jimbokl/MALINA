import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { articles } from '../editorial.mjs';
import { newArticles20260926 } from '../editorial-2026-09-26.mjs';
import { cities } from '../cities.mjs';
import { varieties } from '../data.mjs';
import { cultivarImage } from '../variety-media.mjs';
import { raspberryFacets, raspberryFacetVarieties } from '../catalog-facets.mjs';
import { additionalRaspberryVarieties } from '../raspberry-varieties.mjs';
import { additionalStrawberryVarieties } from '../strawberry-varieties.mjs';
import { depthAdvice } from '../assets/depth-model.mjs';
import { classifyPickerCard, cityForPickerContext } from '../assets/picker-filter.mjs';
import { resolvePickerPlace } from '../assets/picker-place.mjs';
import { getComparisonYields } from '../assets/comparison-model.mjs';

test('подбор распознаёт город и сокращённый регион без ложного совпадения', () => {
  const places = [
    { name: 'Тула', region: 'Тульская область', city: 'Тула' },
    { name: 'Тульская область', region: 'Тульская область', city: '' },
    { name: 'Санкт-Петербург', region: 'Санкт-Петербург', city: 'Санкт-Петербург' }
  ];
  assert.deepEqual(resolvePickerPlace('Тула', places), { region: 'Тульская область', city: 'Тула' });
  assert.deepEqual(resolvePickerPlace('тульская обл.', places), { region: 'Тульская область', city: '' });
  assert.deepEqual(resolvePickerPlace('Санкт Петербург', places), { region: 'Санкт-Петербург', city: 'Санкт-Петербург' });
  assert.equal(resolvePickerPlace('Тулла', places), null);
});

const root = process.env.MALINA_TEST_DIST || fileURLToPath(new URL('../../dist/', import.meta.url));
const routes = ['/', '/malina/', '/klubnika/', '/sorta/', ...raspberryFacets.map(facet => facet.path), '/sravnenie/malina/', '/sravnenie/klubnika/', '/rating/', '/podbor/', '/instrumenty/', '/instrumenty/raschet-sazhencev/', '/instrumenty/raschet-shpalery/', '/instrumenty/raschet-kapelnogo-poliva/', '/instrumenty/obrezka-maliny/', '/instrumenty/glubina-posadki/', '/instrumenty/vybor-mulchi/', '/instrumenty/kalendar-uhoda/', '/instrumenty/proverka-rasteniya/', '/instrumenty/zhurnal-uchastka/', '/otzyvy/', '/goroda/', '/guide/', '/in-vitro/', '/proverka-partii/', '/about/',
  ...varieties.map(variety => `/sorta/${variety.slug}/`),
  '/zhurnal/', '/zhurnal/malina/', '/zhurnal/klubnika/', ...articles.map(article => `/zhurnal/${article.slug}/`)];

test('атлас малины связывает фильтры и карточки с фактами из SQLite', async () => {
  const catalogHtml = await readFile(join(root, 'sorta', 'index.html'), 'utf8');
  const publicCatalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  const bySlug = new Map(publicCatalog.cultivars.map(cultivar => [cultivar.slug, cultivar]));
  assert.equal(bySlug.size, varieties.length);
  for (const category of ['red', 'yellow', 'summer', 'remontant']) {
    assert.ok(additionalRaspberryVarieties.some(v => v.fruitColor === category || v.fruiting === category));
  }
  for (const variety of additionalRaspberryVarieties) {
    const database = bySlug.get(variety.slug);
    assert.ok(database, `Нет записи SQLite: ${variety.slug}`);
    const observations = database.observations;
    if (variety.fruitColor !== 'unknown') {
      const colorValues = variety.fruitColor === 'red' ? ['Красная', 'Ярко-красная', 'Светло-красная', 'Рубиновая', 'Ярко-малиновая'] : ['Жёлтая', 'Золотистая'];
      assert.ok(observations.some(o => o.trait_code === 'fruit_color' && colorValues.includes(o.value_text)), `Нет источника окраски: ${variety.slug}`);
    }
    if (variety.fruiting !== 'unknown') {
      const cycle = variety.fruiting === 'summer' ? 'Летняя' : 'Ремонтантная';
      assert.ok(observations.some(o => o.trait_code === 'fruiting_cycle' && o.value_text === cycle), `Нет источника плодоношения: ${variety.slug}`);
    }
    assert.ok(catalogHtml.includes(`href="/sorta/${variety.slug}/"`));
  }
  assert.match(catalogHtml, /name="fruitColor"/);
});

test('новые сорта клубники есть в SQLite, каталоге и собственных карточках', async () => {
  const catalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  const bySlug = new Map(catalog.cultivars.map(cultivar => [cultivar.slug, cultivar]));
  const catalogHtml = await readFile(join(root, 'sorta', 'index.html'), 'utf8');
  for (const variety of additionalStrawberryVarieties) {
    const record = bySlug.get(variety.slug);
    assert.ok(record, `Нет записи SQLite: ${variety.slug}`);
    assert.equal(record.crop_slug, 'strawberry');
    assert.ok(record.observations.every(item => item.source_key), `Нет источника наблюдения: ${variety.slug}`);
    const detailHtml = await readFile(join(root, 'sorta', variety.slug, 'index.html'), 'utf8');
    assert.match(detailHtml, /Иллюстрация клубники/);
    assert.ok(detailHtml.includes(variety.source));
    assert.ok(catalogHtml.includes(`href="/sorta/${variety.slug}/"`));
    const image = cultivarImage(variety);
    await access(join(root, image.src.slice(1)));
  }
});

test('восемь сортов партии 27 сентября получили отдельные иллюстрации своей культуры', async () => {
  const expected = {
    salyut: '/assets/variety-salyut.webp',
    'yubileinaya-kulikova': '/assets/variety-yubileinaya-kulikova.webp',
    arisha: '/assets/variety-arisha.webp',
    vityaz: '/assets/variety-vityaz.webp',
    slavutich: '/assets/variety-slavutich.webp',
    rusich: '/assets/variety-rusich.webp',
    alfa: '/assets/variety-alfa.webp',
    solovushka: '/assets/variety-solovushka.webp'
  };
  const bySlug = new Map(varieties.map(variety => [variety.slug, variety]));
  const catalogHtml = await readFile(join(root, 'sorta', 'index.html'), 'utf8');
  const cityHtml = await readFile(join(root, 'podbor', 'tula', 'index.html'), 'utf8');
  const cityQuery = new URLSearchParams({ city: 'Тула', region: 'Тульская область' }).toString().replaceAll('&', '&amp;');
  for (const [slug, src] of Object.entries(expected)) {
    const variety = bySlug.get(slug);
    assert.ok(variety, `Нет карточки сорта: ${slug}`);
    const media = cultivarImage(variety);
    assert.equal(media.src, src, `сопоставление изображения: ${slug}`);
    await access(join(root, src.slice(1)));
    const detailHtml = await readFile(join(root, 'sorta', slug, 'index.html'), 'utf8');
    assert.ok(detailHtml.includes(`<img src="${src}"`), `карточка: ${slug}`);
    assert.ok(catalogHtml.includes(`<a href="/sorta/${slug}/"><img src="${src}"`), `каталог: ${slug}`);
    assert.ok(cityHtml.includes(`<a href="/sorta/${slug}/?${cityQuery}"><img src="${src}"`), `подбор города: ${slug}`);
  }
});

test('каждый жёлтый сорт малины использует жёлтую иллюстрацию в каталоге и карточке', async () => {
  const catalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  const yellow = catalog.cultivars.filter(cultivar =>
    cultivar.crop_slug === 'raspberry'
    && cultivar.observations.some(observation => observation.trait_code === 'fruit_color' && observation.value_text === 'Жёлтая'));
  assert.ok(yellow.length > 0);
  await access(join(root, 'assets', 'raspberry-yellow-garden.webp'));
  const catalogHtml = await readFile(join(root, 'sorta', 'index.html'), 'utf8');
  const cityHtml = await readFile(join(root, 'podbor', 'tula', 'index.html'), 'utf8');
  const cityQuery = new URLSearchParams({ city: 'Тула', region: 'Тульская область' }).toString().replaceAll('&', '&amp;');
  for (const cultivar of yellow) {
    const detailHtml = await readFile(join(root, 'sorta', cultivar.slug, 'index.html'), 'utf8');
    assert.match(detailHtml, /<figure class="variety-hero-art[^"]*"><img src="\/assets\/raspberry-yellow-garden\.webp" alt="Иллюстрация жёлтой малины/);
    assert.ok(catalogHtml.includes(`<a href="/sorta/${cultivar.slug}/"><img src="/assets/raspberry-yellow-garden.webp" alt="Иллюстрация жёлтой малины`), `каталог: ${cultivar.slug}`);
    assert.ok(cityHtml.includes(`<a href="/sorta/${cultivar.slug}/?${cityQuery}"><img src="/assets/raspberry-yellow-garden.webp" alt="Иллюстрация жёлтой малины`), `подбор города: ${cultivar.slug}`);
  }
});

test('страницы видов малины показывают только сорта с подтверждённым признаком', async () => {
  const catalogHtml = await readFile(join(root, 'sorta', 'index.html'), 'utf8');
  const raspberryHtml = await readFile(join(root, 'malina', 'index.html'), 'utf8');
  const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8').catch(() => '');
  for (const facet of raspberryFacets) {
    const html = await readFile(join(root, facet.path, 'index.html'), 'utf8');
    const expected = raspberryFacetVarieties(varieties, facet).map(variety => variety.slug);
    const actual = [...html.matchAll(/class="variety-card-media"><a href="\/sorta\/([^/]+)\//g)].map(match => match[1]);
    assert.ok(expected.length > 0, facet.path);
    assert.deepEqual(actual, expected, facet.path);
    assert.ok(catalogHtml.includes(`href="${facet.path}"`), `каталог: ${facet.path}`);
    assert.ok(raspberryHtml.includes(`href="${facet.path}"`), `раздел малины: ${facet.path}`);
    assert.ok(html.includes(`href="${facet.path}" aria-current="page"`), `выбранный раздел: ${facet.path}`);
    if (process.env.SITE_URL) assert.ok(sitemap.includes(`${process.env.SITE_URL}${facet.path}`), facet.path);
  }
});

test('публичные страницы не ссылаются на RHS', async () => {
  for (const route of routes) {
    const html = await readFile(join(root, route, 'index.html'), 'utf8');
    assert.doesNotMatch(html, /RHS|rhs\.org\.uk/i, route);
  }
});

test('разметка каталога, сортов и журнала соответствует видимым страницам', async t => {
  const catalogHtml = await readFile(join(root, 'sorta', 'index.html'), 'utf8');
  if (!catalogHtml.includes('<link rel="canonical"')) {
    t.skip('локальная сборка без SITE_URL не содержит публичной разметки');
    return;
  }
  const origin = 'https://malinaklubnika.ru';
  const schemaAt = async path => {
    const html = await readFile(join(root, path, 'index.html'), 'utf8');
    const json = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
    assert.ok(json, `нет JSON-LD: ${path}`);
    const graph = JSON.parse(json)['@graph'];
    assert.ok(Array.isArray(graph), `нет графа: ${path}`);
    assert.doesNotMatch(json, /"@type":"(?:Product|Review|AggregateRating)"/, path);
    return { html, graph };
  };

  const catalog = await schemaAt('sorta');
  assert.equal(catalog.graph[0]['@type'], 'CollectionPage');
  assert.equal(catalog.graph[0].mainEntity.itemListElement.length, varieties.length);
  for (const [index, variety] of varieties.entries()) {
    const item = catalog.graph[0].mainEntity.itemListElement[index];
    assert.equal(item.url, `${origin}/sorta/${variety.slug}/`);
    assert.ok(catalog.html.includes(`href="/sorta/${variety.slug}/"`));
    const detail = await schemaAt(join('sorta', variety.slug));
    assert.equal(detail.graph[0]['@type'], 'WebPage');
    assert.equal(detail.graph[0].about.name, `${variety.crop}: ${variety.name}`);
    assert.equal(detail.graph[1].itemListElement.at(-1).item, item.url);
  }

  for (const facet of raspberryFacets) {
    const collection = await schemaAt(facet.path.slice(1, -1));
    assert.equal(collection.graph[0]['@type'], 'CollectionPage');
    assert.deepEqual(collection.graph[0].mainEntity.itemListElement.map(item => item.url),
      raspberryFacetVarieties(varieties, facet).map(variety => `${origin}/sorta/${variety.slug}/`));
    assert.equal(collection.graph[1].itemListElement.at(-1).item, `${origin}${facet.path}`);
  }

  for (const [path, selected] of [
    ['zhurnal', articles],
    [join('zhurnal', 'malina'), articles.filter(article => article.crop === 'raspberry' || article.crop === 'both')],
    [join('zhurnal', 'klubnika'), articles.filter(article => article.crop === 'strawberry' || article.crop === 'both')]
  ]) {
    const collection = await schemaAt(path);
    assert.equal(collection.graph[0]['@type'], 'CollectionPage');
    assert.deepEqual(collection.graph[0].mainEntity.itemListElement.map(item => item.url),
      selected.map(article => `${origin}/zhurnal/${article.slug}/`));
    assert.equal(collection.graph[1].itemListElement.at(-1).item, `${origin}/${path}/`);
  }

  const reviews = await schemaAt('otzyvy');
  assert.equal(reviews.graph[0]['@type'], 'WebPage');
  assert.equal(reviews.graph[1].itemListElement.at(-1).item, `${origin}/otzyvy/`);
});

test('памятка подключена к общему и городскому подбору и доступна для печати', async () => {
  for (const path of ['podbor', join('podbor', 'tula')]) {
    const html = await readFile(join(root, path, 'index.html'), 'utf8');
    assert.match(html, /class="picker-memo-open"/);
    assert.match(html, /id="picker-memo" hidden/);
    assert.match(html, /id="picker-memo-print"/);
    assert.match(html, /src="\/assets\/picker-memo\.js\?v=[a-f0-9]+"/);
  }
  await access(join(root, 'assets', 'picker-memo.js'));
});

test('расчёт саженцев доступен с главной, объясняет ограничения и собирается как отдельная страница', async () => {
  const home = await readFile(join(root, 'index.html'), 'utf8');
  const html = await readFile(join(root, 'instrumenty', 'raschet-sazhencev', 'index.html'), 'utf8');
  assert.match(home, /href="\/instrumenty\/raschet-sazhencev\/"/);
  assert.match(html, /<h1>Сколько саженцев/);
  assert.match(html, /name="rowSpacing"/);
  assert.match(html, /name="plantSpacing"/);
  assert.match(html, /<button[^>]+type="submit">Посчитать/);
  assert.match(html, /Первое растение и первый ряд расположены на расстоянии половины шага от края/);
  assert.match(html, /Шаг посадки выбирайте по культуре, сорту и способу выращивания/);
  assert.match(html, /href="\/podbor\/"/);
  assert.match(html, /src="\/assets\/planting\.js\?v=[a-f0-9]+"/);
  await access(join(root, 'assets', 'planting-model.mjs'));
});

test('расчёт шпалеры доступен из инструментов и раскрывает границы результата', async () => {
  const index = await readFile(join(root, 'instrumenty', 'index.html'), 'utf8');
  const html = await readFile(join(root, 'instrumenty', 'raschet-shpalery', 'index.html'), 'utf8');
  assert.match(index, /href="\/instrumenty\/raschet-shpalery\/"/);
  assert.match(html, /<h1>Сколько нужно/);
  assert.match(html, /name="maxSpan"/);
  assert.match(html, /Шаг опор и прочность конструкции проверьте для своего участка/);
  assert.match(html, /src="\/assets\/trellis\.js\?v=[a-f0-9]+"/);
  await access(join(root, 'assets', 'trellis-model.mjs'));
});

test('капельный полив доступен из каталога инструментов и раскрывает формулу и ограничения', async () => {
  const index = await readFile(join(root, 'instrumenty', 'index.html'), 'utf8');
  const html = await readFile(join(root, 'instrumenty', 'raschet-kapelnogo-poliva', 'index.html'), 'utf8');
  assert.match(index, /href="\/instrumenty\/raschet-kapelnogo-poliva\/"/);
  assert.match(html, /<h1>Сколько воды/);
  assert.match(html, /name="spacing"/);
  assert.match(html, /name="flow"/);
  assert.match(html, /name="volumeLiters"/);
  assert.match(html, /Общий расход, л\/ч = число капельниц/);
  assert.match(html, /ucanr\.edu\/site\/maintenance-microirrigation-systems/);
  assert.match(html, /src="\/assets\/drip\.js\?v=[a-f0-9]+"/);
  await access(join(root, 'assets', 'drip-model.mjs'));
});

test('помощник по обрезке связан с малиной и показывает источник и границы', async () => {
  const home = await readFile(join(root, 'index.html'), 'utf8');
  const raspberry = await readFile(join(root, 'malina', 'index.html'), 'utf8');
  const html = await readFile(join(root, 'instrumenty', 'obrezka-maliny', 'index.html'), 'utf8');
  assert.match(home, /href="\/instrumenty\/obrezka-maliny\/"/);
  assert.match(raspberry, /href="\/instrumenty\/obrezka-maliny\/"/);
  assert.match(html, /<h1>Какие побеги/);
  assert.match(html, /value="unknown" checked/);
  assert.match(html, /value="summer"/);
  assert.match(html, /value="primocane"/);
  assert.match(html, /Россельхозцентр/);
  assert.doesNotMatch(html, /RHS|rhs\.org\.uk/i);
  assert.match(html, /src="\/assets\/pruning\.js\?v=[a-f0-9]+"/);
  await access(join(root, 'assets', 'pruning-model.mjs'));
});

test('проверка глубины посадки ведёт к разным действиям и не обобщает микропланты', () => {
  assert.match(depthAdvice({ crop: 'strawberry', stock: 'bare', position: 'buried' }).steps.join(' '), /Освободите сердечко/);
  assert.match(depthAdvice({ crop: 'strawberry', stock: 'bare', position: 'exposed' }).steps.join(' '), /Прикройте корни/);
  assert.match(depthAdvice({ crop: 'raspberry', stock: 'bare', position: 'buried' }).steps.join(' '), /старую отметку/);
  assert.match(depthAdvice({ crop: 'raspberry', stock: 'container', position: 'unknown' }).summary, /Без этих ориентиров/);
  assert.equal(depthAdvice({ crop: 'strawberry', stock: 'micro', position: 'aligned' }).status, 'check');
  assert.throws(() => depthAdvice({ crop: 'other', stock: 'bare', position: 'aligned' }), RangeError);
});

test('инструменты доступны из меню и главной, источники видны на странице проверки', async () => {
  const home = await readFile(join(root, 'index.html'), 'utf8');
  const index = await readFile(join(root, 'instrumenty', 'index.html'), 'utf8');
  const depth = await readFile(join(root, 'instrumenty', 'glubina-posadki', 'index.html'), 'utf8');
  assert.match(home, /href="\/instrumenty\/"/);
  for (const path of ['/podbor/', '/instrumenty/raschet-sazhencev/', '/instrumenty/obrezka-maliny/', '/instrumenty/glubina-posadki/', '/proverka-partii/']) assert.match(index, new RegExp(`href="${path}"`));
  assert.match(depth, /name="crop"/);
  assert.match(depth, /name="stock"/);
  assert.match(depth, /посадка клубники/);
  assert.match(depth, /посадка малины/);
  assert.match(depth, /rosselhoscenter\.ru/);
  assert.doesNotMatch(depth, /RHS|rhs\.org\.uk/i);
  assert.match(depth, /src="\/assets\/depth\.js\?v=[a-f0-9]+"/);
  await access(join(root, 'assets', 'depth-model.mjs'));
});

test('смета шпалеры запрашивает собственные цены и раскрывает исключённые затраты', async () => {
  const html = await readFile(join(root, 'instrumenty', 'raschet-shpalery', 'index.html'), 'utf8');
  assert.match(html, /name="endPostPrice"/);
  assert.match(html, /name="intermediatePostPrice"/);
  assert.match(html, /name="wirePrice"/);
  assert.match(html, /В расчёте только опоры и прямые линии проволоки/);
  assert.match(html, /крепёж, доставка и работа потребуют отдельных строк бюджета/);
  assert.match(html, /src="\/assets\/trellis\.js\?v=[a-f0-9]+"/);
});

test('сравнение мульчи доступно из инструментов и раскрывает область применимости', async () => {
  const index = await readFile(join(root, 'instrumenty', 'index.html'), 'utf8');
  const html = await readFile(join(root, 'instrumenty', 'vybor-mulchi', 'index.html'), 'utf8');
  assert.match(index, /href="\/instrumenty\/vybor-mulchi\/"/);
  assert.match(html, /name="crop"/);
  assert.match(html, /name="system"/);
  assert.match(html, /name="goal"/);
  assert.match(html, /Сравните приёмы мульчирования и выберите материал под задачу/);
  assert.match(html, /extension\.umn\.edu/);
  assert.match(html, /extension\.oregonstate\.edu/);
  assert.match(html, /src="\/assets\/mulch\.js\?v=[a-f0-9]+"/);
  await access(join(root, 'assets', 'mulch-model.mjs'));
});

test('календарь доступен из инструментов, содержит события, журнал и источники', async () => {
  const index = await readFile(join(root, 'instrumenty', 'index.html'), 'utf8');
  const html = await readFile(join(root, 'instrumenty', 'kalendar-uhoda', 'index.html'), 'utf8');
  assert.match(index, /href="\/instrumenty\/kalendar-uhoda\/"/);
  assert.match(html, /<h1>Как ухаживать<br><em>за растениями/);
  assert.match(html, /name="type"/);
  assert.match(html, /name="phase"/);
  assert.match(html, /name="frostForecast"/);
  assert.match(html, /Уход зависит от состояния растения/);
  assert.match(html, /id="calendar-journal"/);
  assert.match(html, /ФАКТИЧЕСКИЕ ДАТЫ/);
  assert.match(html, /id="calendar-journal-list"/);
  assert.match(html, /href="\/instrumenty\/zhurnal-uchastka\/\?crop=raspberry"/);
  assert.match(html, /Россельхозцентр · малина/);
  assert.doesNotMatch(html, /RHS|rhs\.org\.uk/i);
  assert.match(html, /src="\/assets\/calendar\.js\?v=[a-f0-9]+"/);
  await access(join(root, 'assets', 'calendar-model.mjs'));
});

test('помощник осмотра доступен из инструментов и не выдаёт диагноз или обработку', async () => {
  const index = await readFile(join(root, 'instrumenty', 'index.html'), 'utf8');
  const html = await readFile(join(root, 'instrumenty', 'proverka-rasteniya', 'index.html'), 'utf8');
  assert.match(index, /href="\/instrumenty\/proverka-rasteniya\/"/);
  assert.match(html, /name="symptom"/);
  assert.match(html, /name="moisture"/);
  assert.match(html, /name="spread"/);
  assert.match(html, /Симптом — не диагноз/);
  assert.match(html, /Ответы обрабатываются в браузере/);
  assert.match(html, /src="\/assets\/plant-observation\.js\?v=[a-f0-9]+"/);
  await access(join(root, 'assets', 'plant-observation-model.mjs'));
});

test('журнал участка доступен из инструментов и карточки сорта с полями полного сезона', async () => {
  const index = await readFile(join(root, 'instrumenty', 'index.html'), 'utf8');
  const page = await readFile(join(root, 'instrumenty', 'zhurnal-uchastka', 'index.html'), 'utf8');
  const gusar = await readFile(join(root, 'sorta', 'gusar', 'index.html'), 'utf8');
  assert.match(index, /href="\/instrumenty\/zhurnal-uchastka\/"/);
  assert.match(gusar, /href="\/instrumenty\/zhurnal-uchastka\/\?crop=raspberry&amp;cultivar=/);
  for (const name of ['crop', 'cultivar', 'region', 'season', 'plantingDate', 'conditions', 'winterDate', 'winterLoss', 'harvestDate', 'harvestKg', 'harvestMethod']) assert.match(page, new RegExp(`name="${name}"`));
  assert.match(page, /id="grower-journal-import"/);
  assert.match(page, /id="grower-journal-export"/);
  assert.match(page, /id="grower-journal-filter"/);
  assert.match(page, /src="\/assets\/journal\.js\?v=[a-f0-9]+"/);
  await access(join(root, 'assets', 'journal-model.mjs'));
});

test('карточки сортов показывают только проверенные паспорта фактов', async () => {
  const polka = await readFile(join(root, 'sorta', 'polka', 'index.html'), 'utf8');
  const elan = await readFile(join(root, 'sorta', 'elan', 'index.html'), 'utf8');
  const joan = await readFile(join(root, 'sorta', 'joan-j', 'index.html'), 'utf8');
  const karamelka = await readFile(join(root, 'sorta', 'karamelka', 'index.html'), 'utf8');
  const samohval = await readFile(join(root, 'sorta', 'samohval', 'index.html'), 'utf8');
  assert.match(polka, /id="osnovaniya"/);
  assert.match(polka, /Описание плодоношения в карточке сорта/);
  assert.match(polka, /<dt>Тип основания<\/dt><dd>Справочный источник<\/dd>/);
  assert.match(polka, /<time datetime="2026-09-26">26\.09\.2026<\/time>/);
  assert.match(polka, /Описание сорта/);
  assert.match(elan, /Оригинатор отмечает повторное плодоношение и выращивание в контейнерах/);
  assert.doesNotMatch(joan, /id="osnovaniya"/);
  assert.doesNotMatch(polka, /internal_sample_ref|private\/lot/);
  assert.match(karamelka, /Средняя масса ягоды — 3,8 г, максимальная — 8,0 г/);
  assert.match(karamelka, /В результатах исследования средняя масса ягоды сорта Карамелька составила 4,0 г/);
  assert.match(karamelka, /Печатная с\. 95, абзац описания сорта «Карамелька»/);
  assert.match(karamelka, /Печатная с\. 98, абзац о средней массе ягод сортов «Самохвал» и «Карамелька»/);
  assert.match(samohval, /Средняя масса ягоды — 5,9 г, максимальная — 9,1 г/);
  assert.match(samohval, /В результатах исследования средняя масса ягоды сорта Самохвал составила 3,9 г/);
  assert.match(samohval, /Печатная с\. 95, абзац описания сорта «Самохвал»/);
  assert.match(samohval, /Печатная с\. 98, абзац о средней массе ягод сортов «Самохвал» и «Карамелька»/);
});

test('каталог переключает иллюстрации и характеристики без подмены фото сорта', async () => {
  const html = await readFile(join(root, 'sorta', 'index.html'), 'utf8');
  assert.match(html, /data-catalog-view="illustrations" aria-pressed="true">Иллюстрации/);
  assert.match(html, /data-catalog-view="facts" aria-pressed="false">Характеристики/);
  assert.match(html, /id="catalog-results" data-view="illustrations"/);
  assert.match(html, /catalog-facts/);
  assert.match(html, /Источник:/);
  assert.match(html, /Иллюстрация (малины|клубники)/);
  const js = await readFile(join(root, 'assets', 'site.js'), 'utf8');
  assert.match(js, /results\.dataset\.view = view/);
  assert.match(js, /aria-pressed/);
});

test('сравнение сортов отдаёт полезный HTML, источники и корректные границы данных', async () => {
  for (const [crop, slug] of [['малины', 'malina'], ['клубники', 'klubnika']]) {
    const html = await readFile(join(root, 'sravnenie', slug, 'index.html'), 'utf8');
    assert.match(html, new RegExp(`Сравнить сорта<br><em>${crop}\\.`));
    assert.match(html, /<details class="comparison-chooser" id="comparison-chooser"><summary>Изменить сорта для сравнения<\/summary>/);
    assert.ok(html.indexOf('id="comparison-rows"') < html.indexOf('id="comparison-chooser"'), 'результат сравнения расположен до длинного списка сортов');
    assert.match(html, /Сравните характеристики сортов и откройте источник в любой строке/);
    assert.match(html, /comparison-data/);
    assert.match(html, /comparison\.js/);
    assert.match(html, /проверено 26\.09\.2026/);
    const payload = html.match(/<script id="comparison-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
    assert.ok(payload, 'Сравнение должно содержать данные сортов и регионов');
    const data = JSON.parse(payload);
    assert.ok(data.varieties.length > 0);
    assert.ok(data.varieties.every(item => item.reviewedAt), 'дата проверки хранится у каждой сравниваемой записи');
    assert.ok(data.cities.some(city => city.slug === 'tula'));
    assert.ok(data.regions.some(region => region.name_ru === 'Тульская область' && region.admission_region_number === 3));
    assert.ok(data.varieties.every(item => Array.isArray(item.admissions)));
    assert.ok(data.varieties.every(item => item.yieldObservation === null || item.yieldObservation?.evidence), 'в сравнение попадают только урожайности с публичным паспортом');
    assert.match(html, /Урожайность в источнике/);
    assert.ok(data.varieties.some(item => item.yieldObservation), 'проверенные результаты урожайности доступны сравнению');
    const htmlReviewedDates = new Set([...html.matchAll(/проверено (\d{2}\.\d{2}\.\d{4})/g)].map(match => match[1]));
    assert.ok([...new Set(data.varieties.slice(0, 4).map(item => item.reviewedAt))].every(date => htmlReviewedDates.has(date)), 'серверный HTML показывает даты первых четырёх сортов');
    const header = html.match(/<table class="comparison-table">[\s\S]*?<thead><tr>([\s\S]*?)<\/tr><\/thead>/)?.[1];
    assert.ok(header, 'таблица сравнения видна без JavaScript');
    assert.equal((header.match(/<th scope="col">/g) || []).length, 5, 'исходная таблица содержит параметр и четыре сорта');
    assert.equal((html.match(/name="cultivar" value="[^"]+" checked/g) || []).length, 4, 'в длинном списке отмечены только четыре сорта');
  }
  const script = await readFile(join(root, 'assets', 'comparison.js'), 'utf8');
  assert.match(script, /resolveComparisonPlace/);
  assert.match(script, /Строка Госреестра/);
  assert.match(script, /item\.reviewedAt \|\| root\.dataset\.reviewedAt/);
  assert.match(script, /selected\.length < 2 && chooser/);
  const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8').catch(() => '');
  if (process.env.SITE_URL) {
    assert.match(sitemap, /\/sravnenie\/malina\//);
    assert.match(sitemap, /\/sravnenie\/klubnika\//);
  }
});

test('сравнение клубники показывает оба источника урожайности для Русича и Зенги Зенганы', async () => {
  const html = await readFile(join(root, 'sravnenie', 'klubnika', 'index.html'), 'utf8');
  const payload = html.match(/<script id="comparison-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  const varieties = JSON.parse(payload).varieties;
  for (const slug of ['rusich', 'zenga-zengana']) {
    const item = varieties.find(variety => variety.slug === slug);
    assert.equal(item.yieldObservations.length, 2, slug);
  }
  for (const value of ['21,6 т/га', '148,3 ц/га', '7,7 т/га', '127,5 ц/га']) {
    assert.ok(varieties.some(item => getComparisonYields(item).some(row => row.value === value)), value);
  }
  assert.ok(varieties.some(item => (item.yieldObservations || []).some(row =>
    row.source_url.includes('vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-25'))));
});

test('карточки Русича и Зенги Зенганы показывают оба измерения урожайности с условиями и источниками', async () => {
  const expected = {
    rusich: ['21,6 т/га', '148,3 ц/га'],
    'zenga-zengana': ['7,7 т/га', '127,5 ц/га']
  };
  for (const [slug, values] of Object.entries(expected)) {
    const html = await readFile(join(root, 'sorta', slug, 'index.html'), 'utf8');
    const facts = html.match(/<section class="section wrap facts-section">([\s\S]*?)<\/section>/)?.[1];
    assert.ok(facts, slug);
    assert.match(facts, /Результаты исследований/);
    for (const value of values) assert.ok(facts.includes(value), `${slug}: ${value}`);
    assert.match(facts, /Московская область указана в заголовке публикации/);
    assert.match(facts, /vniispk\.ru\/pages\/activities\/science-activities\/conference-2008\/publ-2008-25/);
  }
});

test('журнал содержит проверяемые статьи, авторство, ссылки и права на изображения', async () => {
  assert.ok(articles.length >= 10);
  const slugs = new Set();
  for (const article of articles) {
    assert.ok(!slugs.has(article.slug), `повтор статьи: ${article.slug}`);
    slugs.add(article.slug);
    assert.ok(article.sources.length > 0);
    assert.ok(article.sections.every(section => section.sources.length && section.sources.every(index => article.sources[index])));
    const publishedIso = article.publishedIso ?? '2026-09-25';
    const reviewedIso = article.reviewedIso ?? '2026-09-25';
    const html = await readFile(join(root, 'zhurnal', article.slug, 'index.html'), 'utf8');
    assert.match(html, /<article class="media-article">/);
    assert.match(html, /<meta property="og:type" content="article">/);
    assert.match(html, /<meta property="og:site_name" content="МАЛИНА — КЛУБНИКА">/);
    assert.match(html, /<meta name="twitter:card" content="summary(?:_large_image)?">/);
    assert.ok(html.includes(`<meta property="article:published_time" content="${publishedIso}">`));
    assert.ok(html.includes(`<meta property="article:modified_time" content="${reviewedIso}">`));
    if (process.env.SITE_URL) {
      const siteBase = process.env.SITE_BASE && process.env.SITE_BASE !== '/' ? process.env.SITE_BASE.replace(/\/$/, '') : '';
      assert.match(html, new RegExp(`<meta property="og:url" content="${process.env.SITE_URL}/zhurnal/${article.slug}/">`));
      const socialImage = article.heroImage?.file ?? 'berries-hero.webp';
      assert.ok(html.includes(`<meta property="og:image" content="${process.env.SITE_URL}${siteBase}/assets/${socialImage}">`));
      assert.ok(html.includes(`<meta name="twitter:image" content="${process.env.SITE_URL}${siteBase}/assets/${socialImage}">`));
      assert.match(html, /<meta property="og:image:width" content="1536">/);
      assert.match(html, /<meta property="og:image:height" content="1024">/);
    }
    assert.match(html, /Автор: <a href="\/about\/">Редакция МАЛИНА — КЛУБНИКА<\/a>/);
    assert.ok(html.includes(`<time datetime="${publishedIso}">`));
    assert.ok(html.includes(`<time datetime="${reviewedIso}">`));
    if (process.env.SITE_URL) {
      assert.match(html, new RegExp(`"datePublished":"${publishedIso}"`));
      assert.match(html, new RegExp(`"dateModified":"${reviewedIso}"`));
    }
    if (article.heroImage) assert.ok(html.includes(article.heroImage.caption), `нет подписи к изображению статьи ${article.slug}`);
    else assert.match(html, /Иллюстрация культуры, созданная для сайта генератором изображений/);
    assert.match(html, /<section class="media-sources"/);
    assert.match(html, /data-share-article="vk"/);
    assert.match(html, /data-share-article="pinterest"/);
    assert.match(html, /data-share-article="copy"/);
    for (const source of article.sources) assert.ok(html.includes(source.url.replaceAll('&', '&amp;')));
  }
  const plantArticle = await readFile(join(root, 'zhurnal', 'kak-vybrat-sazhentsy-klubniki', 'index.html'), 'utf8');
  assert.match(plantArticle, /спящими растениями с открытыми корнями/);
  assert.match(plantArticle, /Микроклон после лабораторного размножения/);
  assert.match(plantArticle, /письменные условия хранения и посадки/);
  const cultivarGuide = await readFile(join(root, 'zhurnal', 'kak-vybrat-sort-klubniki', 'index.html'), 'utf8');
  assert.match(cultivarGuide, /один более дружный сбор или несколько волн/);
  assert.match(cultivarGuide, /Ищите наблюдения из местности с похожими зимами/);
  assert.match(cultivarGuide, /strawberry-varieties-for-home-gardens/);
  assert.match(cultivarGuide, /href="\/zhurnal\/kak-vybrat-sazhentsy-klubniki\/"/);
  assert.match(cultivarGuide, /href="\/sorta\/cambridge-favourite\/"/);
  const home = await readFile(join(root, 'index.html'), 'utf8');
  assert.match(home, /home-editorial/);
  const readLinks = [...home.matchAll(/<a class="media-card-link" href="\/zhurnal\/([^" ]+)\/">Читать материал/g)];
  assert.ok(readLinks.length >= 1, 'на главной нет кликабельных ссылок «Читать материал»');
  assert.equal(readLinks.length, (home.match(/Читать материал/g) || []).length);
  for (const [, slug] of readLinks) {
    await access(join(root, 'zhurnal', slug, 'index.html'));
  }
  const homeHtml = await readFile(join(root, 'index.html'), 'utf8');
  if (homeHtml.includes('type="application/rss+xml"')) {
    const feed = await readFile(join(root, 'feed.xml'), 'utf8');
    assert.equal((feed.match(/<item>/g) || []).length, articles.length);
    assert.match(feed, /<media:content /);
    assert.match(feed, /<pubDate>Sat, 26 Sep 2026 00:00:00 GMT<\/pubDate>/);
    assert.ok(feed.indexOf('/zhurnal/malinovoe-derevo-tarusa/') < feed.indexOf('/zhurnal/posadka-klubniki/'));
  }
});

test('первый выпуск содержит ровно 20 новых доступных и датированных страниц', async () => {
  assert.equal(newArticles20260926.length, 20);
  assert.equal(new Set(newArticles20260926.map(article => article.slug)).size, 20);
  for (const article of newArticles20260926) {
    const html = await readFile(join(root, 'zhurnal', article.slug, 'index.html'), 'utf8');
    assert.ok(html.includes('<time datetime="2026-09-26">26.09.2026</time>'));
    assert.ok(html.includes(`<h1>${article.title}</h1>`));
    assert.ok(html.includes('href="#sources"'));
  }
});

test('материал о Frigo связывает сроки хранения и сбора с источником и шагом для покупателя', async () => {
  const frigo = articles.find(article => article.slug === 'klubnika-frigo-chto-proverit');
  assert.ok(frigo);
  assert.equal(frigo.reviewedIso, '2026-09-27');
  const html = await readFile(join(root, 'zhurnal', 'klubnika-frigo-chto-proverit', 'index.html'), 'utf8');
  assert.match(html, /Почему срок хранения не задаёт дату урожая/);
  assert.match(html, /В японском опыте Yano и коллег с горшечной рассадой/);
  assert.match(html, /состояние цветочной почки перед хранением, дату подъёма и режим хранения/);
  assert.match(html, /jstage\.jst\.go\.jp\/article\/hrj\/23\/4\/23_271/);
  assert.match(html, /практические шаги связаны с источниками выше/);
  assert.doesNotMatch(html, /Исходные изображения и текст источников не перепечатаны/);
});

test('статья о посадке объясняет различия культур и происхождение иллюстраций', async () => {
  const html = await readFile(join(root, 'zhurnal', 'posadka-sazhentsev-maliny-i-klubniki', 'index.html'), 'utf8');
  assert.match(html, /<h1>Как посадить саженцы малины и клубники без типичных ошибок<\/h1>/);
  assert.match(html, /<aside class="media-toc" aria-label="Содержание статьи">/);
  assert.match(html, /href="#section-6"/);
  assert.match(html, /сердечко видно/);
  assert.match(html, /Уточните сроки посадки и зимовки по погоде вашего участка/);
  assert.match(html, /Как подготовлен материал/);
  assert.match(html, /David T\. Handley · Bulletin #2067: Growing Strawberries/);
  assert.match(html, /University of Illinois Extension · Growing Raspberries/);
  if (process.env.SITE_URL) assert.match(html, /"@type":"BreadcrumbList"/);
  for (const file of ['article-planting-aftercare.webp', 'article-raspberry-roots.webp', 'article-strawberry-crown.webp']) {
    assert.ok(html.includes(`/assets/${file}`));
    await access(join(root, 'assets', file));
  }
});

test('карточки без подтверждённых предложений не обещают цену или наличие', async () => {
  const catalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  for (const cultivar of catalog.cultivars) {
    if (cultivar.offers.length || cultivar.own_batches.length) continue;
    const html = await readFile(join(root, 'sorta', cultivar.slug, 'index.html'), 'utf8');
    assert.doesNotMatch(html, /data-affiliate-offer=/);
    assert.doesNotMatch(html, /class="commerce-card"/);
  }
});

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

test('проверка партии даёт локальный чеклист без передачи данных или вывода о качестве', async () => {
  const html = await readFile(join(root, 'proverka-partii', 'index.html'), 'utf8');
  assert.match(html, /Frigo/);
  assert.match(html, /цветочной почки/);
  assert.match(html, /после In Vitro/);
  assert.match(html, /Попросите связать каждый документ с названием сорта и конкретной партией/);
  assert.match(html, /name="planting-stock"/);
  assert.match(html, /<script defer src="\/assets\/lot-checklist\.js\?v=[a-f0-9]+"><\/script>/);
  assert.match(html, /id="lot-request-text"[^>]*readonly/);
  assert.match(html, /id="lot-copy"/);
  assert.match(html, /fps\.ucdavis\.edu\/strawberry\.cfm/);
  assert.match(html, /californiaagriculture\.org\/api\/v1\/articles\/112420-meristem-culture-for-elimination-of-strawberry-viruses\.pdf/);
  const js = await readFile(join(root, 'assets', 'lot-checklist.js'), 'utf8');
  assert.match(js, /отмечено \$\{checked\} из \$\{activeChecks\.length\} вопросов продавцу/i);
  assert.match(js, /status\.textContent/);
  assert.match(js, /activeChecks\.filter/);
  assert.match(js, /copy\.addEventListener\('click'/);
  assert.doesNotMatch(js, /fetch\(|localStorage|sessionStorage/);
});

test('страница In Vitro объясняет проверку партии без обещания оздоровления', async () => {
  const html = await readFile(join(root, 'in-vitro', 'index.html'), 'utf8');
  assert.match(html, /фитосанитарного тестирования/);
  assert.match(html, /Это способ производства посадочного материала, а не название сорта или знак качества партии/);
  assert.match(html, /scielo\.cl\/pdf\/bres/);
});

test('карточки показывают источник и границы применимости данных', async () => {
  for (const route of varieties.map(variety => `/sorta/${variety.slug}/`)) {
    const html = await readFile(join(root, route, 'index.html'), 'utf8');
    const slug = route.split('/')[2];
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? '';
    assert.match(title, /^(Малина|Клубника) .+: описание сорта, фото, урожайность, отзывы садоводов/);
    assert.match(html, /name="description" content="[^"]*(описание сорта|урожайность)[^"]*отзывы садоводов/);
    const variety = varieties.find(item => route === `/sorta/${item.slug}/`);
    assert.match(html, /КРАТКО О СОРТЕ/);
    assert.match(html, /Иллюстрация (малины|жёлтой малины|клубники)/);
    assert.ok(html.includes(variety.source));
    assert.doesNotMatch(html, /RHS|rhs\.org\.uk/i);
    assert.match(html, /id="reviews-root"[^>]*data-cultivar=/);
    assert.match(html, /Отзывы о сорте/);
    assert.match(html, /name="cultivar_name" value=/);
  }
});

test('в навигации и материалах используем привычное название «клубника»', async () => {
  for (const route of ['/', '/klubnika/', '/zhurnal/klubnika/']) {
    const html = await readFile(join(root, route, 'index.html'), 'utf8');
    assert.doesNotMatch(html, /садовая земляника|садовой земляники/i);
    assert.match(html, /Клубника|клубника/);
  }
});

test('справочная урожайность Гусара остаётся в паспорте, но не подменяет результат полевого опыта', async () => {
  const html = await readFile(join(root, 'sorta', 'gusar', 'index.html'), 'utf8');
  const catalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  const gusar = catalog.cultivars.find(row => row.slug === 'gusar');
  const yieldRow = gusar.observations.find(row => row.trait_code === 'yield');
  assert.equal(yieldRow.value_number, 7);
  assert.equal(yieldRow.value_max, 9);
  assert.equal(yieldRow.unit, 'т/га');
  assert.equal(yieldRow.source_key, 'fnc-gusar');
  assert.equal(yieldRow.evidence.evidence_kind, 'reference_document');
  assert.match(html, /<span>Урожайность<\/span><strong>—<\/strong>/);
  assert.match(html, /<h3>7–9 т\/га<\/h3>/);
  assert.match(html, /место, годы и метод измерения не указаны/);
  assert.match(html, /Это не прогноз урожая на конкретном участке/);
});

test('Азия опубликована с ограничением итальянского источника и без обещания урожая в России', async () => {
  const html = await readFile(join(root, 'sorta', 'aziya', 'index.html'), 'utf8');
  const catalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  const asia = catalog.cultivars.find(row => row.slug === 'aziya');
  assert.ok(asia);
  assert.match(html, /Geoplant Vivai · Asia NF421/);
  assert.match(html, /Иллюстрация клубники/);
  assert.ok(asia.observations.every(row => row.source_key === 'geoplant-asia-nf421'));
  assert.equal(asia.recommendations.length, 0);
});

test('Мурано и Альба опубликованы с исходными наблюдениями без региональных рекомендаций', async () => {
  const catalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  for (const [slug, sourceKey] of [['murano', 'civ-murano-technical'], ['alba', 'geoplant-alba-nf311']]) {
    const html = await readFile(join(root, 'sorta', slug, 'index.html'), 'utf8');
    const cultivar = catalog.cultivars.find(row => row.slug === slug);
    assert.ok(cultivar);
    assert.match(html, /Иллюстрация клубники/);
    assert.match(html, /ПРОИСХОЖДЕНИЕ ДАННЫХ/);
    assert.ok(cultivar.observations.length >= 2);
    assert.ok(cultivar.observations.every(row => row.source_key === sourceKey));
    assert.equal(cultivar.recommendations.length, 0);
  }
});

test('каталог городов ищет по названию и ведёт к региональному опыту без климатических обещаний', async () => {
  const html = await readFile(join(root, '/goroda/', 'index.html'), 'utf8');
  const js = await readFile(join(root, '/assets/cities.js'), 'utf8');
  assert.equal(cities.length, 55);
  assert.equal(new Set(cities.map(city => city.slug)).size, cities.length);
  assert.equal(new Set(cities.map(city => city.name)).size, cities.length);
  assert.match(html, /id="city-search"/);
  assert.match(html, /data-city-card/);
  assert.match(html, /href="\/podbor\/astraxan\/"/);
  assert.match(html, /href="\/otzyvy\/\?city=%D0/);
  assert.match(html, /href="\/sravnenie\/malina\/\?city=%D0/);
  assert.match(html, /href="\/sravnenie\/klubnika\/\?city=%D0/);
  assert.match(html, /<h2>Калининград<\/h2>/);
  assert.match(html, /ГОРОД — КОНТЕКСТ ДЛЯ ПОДБОРА/);
  assert.match(js, /toLocaleLowerCase\('ru-RU'\)/);
});

test('город передаёт регион в подбор и показывает пользователю его контекст', async () => {
  const picker = await readFile(join(root, '/podbor/', 'index.html'), 'utf8');
  const tula = await readFile(join(root, '/podbor/tula/', 'index.html'), 'utf8');
  const js = await readFile(join(root, '/assets/site.js'), 'utf8');
  assert.match(tula, /<title>Подбор сортов малины и клубники — Тула/);
  assert.match(tula, /<h1>Ягодный сад:<br><em>Тула\.<\/em><\/h1>/);
  assert.match(picker, /id="picker-city-context" hidden/);
  assert.match(picker, /list="picker-places"/);
  assert.match(picker, /<option value="Тула" data-region="Тульская область" data-city="Тула"/);
  assert.match(picker, /id="picker-place-error" role="alert" hidden/);
  assert.match(picker, /id="picker-place-continue" type="button" hidden/);
  assert.match(picker, /id="picker-edit-conditions" class="picker-edit-conditions" type="button">← Изменить условия<\/button>/);
  assert.match(js, /params\.get\('city'\)/);
  assert.match(js, /params\.get\('region'\)/);
  assert.match(js, /regionInput\.value = cityRegion/);
  assert.match(js, /Выберите культуру и посмотрите сорта./);
  assert.match(picker, /name="shelter" value="unknown" checked/);
  assert.match(picker, /name="drainage" value="unknown" checked/);
  assert.match(picker, /id="picker-conditions" class="region-status" hidden/);
  assert.match(tula, /name="shelter" value="unknown" checked/);
  assert.match(js, /conditionsNote\.hidden = openQuestions\.length === 0/);
});

test('город сохраняется в переходе к сорту и его отзывам даже без JavaScript', async () => {
  const tula = await readFile(join(root, '/podbor/tula/', 'index.html'), 'utf8');
  const query = new URLSearchParams({ city: 'Тула', region: 'Тульская область' }).toString().replaceAll('&', '&amp;');
  assert.ok(tula.includes(`href="/sorta/gusar/?${query}#gosreestr"`));
  assert.ok(tula.includes(`href="/sorta/abrikosovaya/?${query}#otzyvy"`));
  assert.ok(tula.includes(`href="/sorta/festivalnaya/?${query}#otzyvy"`));
  assert.doesNotMatch(tula, /href="\/sorta\/gusar\/#otzyvy"/);
});

test('подбор даёт быстрый результат и сохраняет выбранный город до сравнения', async () => {
  const picker = await readFile(join(root, 'podbor', 'index.html'), 'utf8');
  const cityPicker = await readFile(join(root, 'podbor', 'tula', 'index.html'), 'utf8');
  const comparison = await readFile(join(root, 'sravnenie', 'malina', 'index.html'), 'utf8');
  const wizard = await readFile(join(root, 'assets', 'picker-wizard.js'), 'utf8');
  const siteJs = await readFile(join(root, 'assets', 'site.js'), 'utf8');
  const compareJs = await readFile(join(root, 'assets', 'picker-compare.js'), 'utf8');
  const verifiedJs = await readFile(join(root, 'assets', 'verified-selector.js'), 'utf8');
  assert.match(picker, /assets\/picker-wizard\.js\?v=/);
  assert.match(cityPicker, /assets\/picker-wizard\.js\?v=/);
  assert.match(picker, /<details class=\"picker-advanced\">/);
  assert.match(picker, /<summary>Уточнить условия участка/);
  assert.match(picker, /type=\"submit\">Показать сорта/);
  assert.match(cityPicker, /<details class=\"picker-advanced\">/);
  assert.doesNotMatch(wizard, /picker-stage|aria-valuemax/);
  assert.match(siteJs, /pickerForm\.dataset\.activeCity = activeCity/);
  assert.match(siteJs, /pickerForm\.dataset\.activeRegion = region/);
  assert.match(siteJs, /picker:location-change/);
  assert.match(siteJs, /output\.hidden = true/);
  assert.match(compareJs, /form\.dataset\.activeCity/);
  assert.match(compareJs, /form\.dataset\.activeRegion/);
  assert.match(compareJs, /picker:location-change/);
  assert.match(verifiedJs, /form\.dataset\.activeCity/);
  assert.match(verifiedJs, /picker:location-change/);
  assert.match(verifiedJs, /recordWord\(admissions\.count\)/);
  assert.match(comparison, /tabindex="0" role="region" aria-label="Таблица сравнения сортов/);
});

test('смена региона в городском подборе убирает прежний город из перехода к отзывам', () => {
  assert.equal(cityForPickerContext('Тула', 'Тульская область', 'Тульская область'), 'Тула');
  assert.equal(cityForPickerContext('Тула', 'Тульская область', 'Московская область'), '');
  assert.equal(cityForPickerContext('Орёл', 'Орловская область', 'орловская область'), 'Орёл');
  assert.equal(cityForPickerContext('Орёл', 'Орловская область', ''), '');
});

test('городской отзыв связывает место и обсуждение с карточкой сорта', async () => {
  const reviews = await readFile(join(root, '/otzyvy/', 'index.html'), 'utf8');
  const js = await readFile(join(root, '/assets/reviews.js'), 'utf8');
  const polka = await readFile(join(root, '/sorta/', 'polka', 'index.html'), 'utf8');
  assert.match(reviews, /data-cultivar-links=/);
  assert.match(js, /Открыть отзывы о сорте/);
  assert.match(js, /Отзывы садоводов из региона/);
  assert.match(js, /review\.parent_id/);
  assert.match(polka, /id="otzyvy"/);
});

test('названия сортов в публичном каталоге и данных даны по-русски', async () => {
  const expected = new Map([
    ['polka', 'Полька'],
    ['joan-j', 'Джоан Джей'],
    ['murano', 'Мурано'],
    ['alba', 'Альба'],
    ['cambridge-favourite', 'Кембридж Фаворит'],
    ['elan', 'Элан']
  ]);
  const catalogHtml = await readFile(join(root, '/sorta/', 'index.html'), 'utf8');
  const publicCatalog = JSON.parse(await readFile(join(root, '/data/catalog.json'), 'utf8'));
  for (const [slug, name] of expected) {
    const html = await readFile(join(root, '/sorta/', slug, 'index.html'), 'utf8');
    assert.match(html, new RegExp(`<h1>${name}<`));
    assert.match(catalogHtml, new RegExp(`<h3><a href="/sorta/${slug}/">${name}</a></h3>`));
    assert.equal(publicCatalog.cultivars.find(item => item.slug === slug)?.canonical_name, name);
  }
});

test('подбор запрашивает регион и честно отмечает отсутствие региональных правил', async () => {
  const html = await readFile(join(root, '/podbor/', 'index.html'), 'utf8');
  const js = await readFile(join(root, '/assets/site.js'), 'utf8');
  const verifiedJs = await readFile(join(root, '/assets/verified-selector.js'), 'utf8');
  assert.match(html, /name="region"[^>]*required/);
  assert.match(html, /id="picker-form"/);
  assert.match(js, /Выберите культуру и посмотрите сорта./);
  assert.match(html, /id="verified-status"/);
  assert.match(html, /id="picker-admission-status"/);
  assert.doesNotMatch(html, /id="verified-region"/);
  assert.match(verifiedJs, /querySelector\('#picker-form'\)/);
  assert.match(html, /assets\/verified-selector\.js/);
});

test('подбор срока сбора связан с источниками и не обещает даты для региона', async () => {
  const html = await readFile(join(root, '/podbor/', 'index.html'), 'utf8');
  const allowed = new Set(['early', 'middle', 'late', 'autumn', 'repeat', 'unknown']);
  for (const variety of varieties) {
    assert.ok(allowed.has(variety.harvestTiming), `нет срока сбора для ${variety.slug}`);
    assert.ok(html.includes(`data-cultivar-slug="${variety.slug}"`));
    assert.ok(html.includes(`data-harvest-timing="${variety.harvestTiming}"`));
  }
  assert.match(html, /name="harvestTiming" value="early"/);
  assert.match(html, /name="harvestTiming" value="repeat"/);
  assert.match(html, /Сравните ранний, средний и поздний сроки из описаний сортов/);
});

test('подбор отличает неподходящий сорт от сорта с неполными данными', () => {
  const selected = { crop: 'strawberry', light: 'sun', setting: 'ground', fruiting: 'all', harvestTiming: 'all' };
  assert.deepEqual(classifyPickerCard({ crop: 'strawberry', light: 'sun', setting: 'ground' }, selected), { status: 'match', missing: [] });
  assert.deepEqual(classifyPickerCard({ crop: 'strawberry', light: 'unknown', setting: 'unknown' }, selected), {
    status: 'needs-evidence', missing: ['освещённость', 'место выращивания']
  });
  assert.deepEqual(classifyPickerCard({ crop: 'strawberry', light: 'shade', setting: 'ground' }, selected), { status: 'exclude', missing: [] });
  assert.deepEqual(classifyPickerCard({ crop: 'raspberry', light: 'sun', setting: 'ground' }, selected), { status: 'exclude', missing: [] });
});

test('подбор связывает выбранные сорта со сравнением и сохраняет контекст города', async () => {
  const html = await readFile(join(root, '/podbor/tula/', 'index.html'), 'utf8');
  assert.match(html, /id="picker-form" data-city="Тула" data-region="Тульская область"/);
  assert.match(html, /id="picker-compare-link"/);
  assert.match(html, /class="picker-compare-checkbox" value="gusar"/);
  assert.match(html, /assets\/picker-compare\.js\?v=/);
});

test('публичный JSON подключается к WASM и выдаёт только проверенные местные правила', async () => {
  const catalog = await readFile(join(root, '/data/catalog.json'), 'utf8');
  const data = JSON.parse(catalog);
  assert.equal(data.schema_version, 1);
  assert.equal(data.cultivars.length, varieties.length);
  const regionalRules = data.cultivars.flatMap(cultivar => cultivar.recommendations.map(rule => ({ slug: cultivar.slug, rule })));
  assert.deepEqual(regionalRules.map(({ slug, rule }) => [slug, rule.region_code]).sort(), [
    ['desnyanka-kokinskaya', 'orenburg-oblast'], ['salyut', 'bryansk-oblast'],
    ['samohval', 'leningrad-oblast'], ['solovushka', 'bryansk-oblast']
  ]);
  assert.ok(regionalRules.every(({ rule }) => rule.basis_kind === 'regional_trial' && rule.basis_source_locator));
  const wasm = await readFile(join(root, '/assets/selector/malina_selector_bg.wasm'));
  assert.equal(wasm.subarray(0, 4).toString('hex'), '0061736d');
  const { initSync, select_varieties } = await import('../../dist/assets/selector/malina_selector.js');
  initSync({ module: wasm });
  const result = JSON.parse(select_varieties(catalog, JSON.stringify({ region_code: 'kaliningrad-oblast' })));
  assert.equal(result.total, 0);
  assert.deepEqual(result.matches, []);
  assert.equal(result.error, undefined);
  const bryansk = JSON.parse(select_varieties(catalog, JSON.stringify({ region_code: 'bryansk-oblast' })));
  assert.equal(bryansk.total, 2);
  assert.deepEqual(bryansk.matches.map(match => match.slug).sort(), ['salyut', 'solovushka']);
});

test('официальный допуск для Тулы виден с источником и не становится местной рекомендацией', async () => {
  const catalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  const tula = catalog.regions.find(region => region.code === 'tula-oblast');
  const kaliningrad = catalog.regions.find(region => region.code === 'kaliningrad-oblast');
  const gusar = catalog.cultivars.find(cultivar => cultivar.slug === 'gusar');
  assert.equal(tula.admission_region_number, 3);
  assert.equal(kaliningrad.admission_region_number, 2);
  assert.deepEqual(gusar.admissions.map(item => item.admission_region_number), [2, 3, 4, 6, 7]);
  assert.ok(gusar.admissions.every(item => item.registry_entry_code === '9902171' && item.source_pdf_page === 418));
  assert.equal(gusar.recommendations.length, 0);
  const html = await readFile(join(root, 'sorta', 'gusar', 'index.html'), 'utf8');
  assert.match(html, /id="gosreestr"/);
  assert.match(html, /gossortrf\.ru\/upload\/[^" ]+#page=418/);
  assert.match(html, /По изданию реестра на 2024-05-31/);
  for (const city of ['kaliningrad', 'tula', 'kazan']) {
    const cityHtml = await readFile(join(root, 'podbor', city, 'index.html'), 'utf8');
    assert.match(cityHtml, /Гусар · допуск в Госреестре/);
    assert.match(cityHtml, /9902171/);
    assert.match(cityHtml, /#page=418/);
    assert.match(cityHtml, /издание на 2024-05-31, запись 9902171/);
  }
  const unrelatedCity = await readFile(join(root, 'podbor', 'arkhangelsk', 'index.html'), 'utf8');
  assert.doesNotMatch(unrelatedCity, /Гусар · допуск в Госреестре/);
});

test('официальный допуск Фестивальной охватывает регионы 1–11 без обещаний для участка', async () => {
  const catalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  const festivalnaya = catalog.cultivars.find(cultivar => cultivar.slug === 'festivalnaya');
  assert.deepEqual(festivalnaya.admissions.map(item => item.admission_region_number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.ok(festivalnaya.admissions.every(item => item.registry_entry_code === '5801427' && item.source_pdf_page === 415));
  assert.deepEqual(festivalnaya.recommendations, []);
  assert.deepEqual(festivalnaya.observations, []);
  for (const [city, zone] of [['arkhangelsk', 1], ['belgorod', 5], ['astraxan', 8], ['ufa', 9], ['novosibirsk', 10], ['irkutsk', 11]]) {
    const cityHtml = await readFile(join(root, 'podbor', city, 'index.html'), 'utf8');
    assert.match(cityHtml, /Фестивальная · допуск в Госреестре/);
    assert.match(cityHtml, /#page=415/);
    const cityRecord = cities.find(item => item.slug === city);
    assert.equal(catalog.regions.find(region => region.name_ru === cityRecord.region)?.admission_region_number, zone);
  }
  const farEastHtml = await readFile(join(root, 'podbor', 'vladivostok', 'index.html'), 'utf8');
  assert.doesNotMatch(farEastHtml, /Фестивальная · допуск в Госреестре/);
  const varietyHtml = await readFile(join(root, 'sorta', 'festivalnaya', 'index.html'), 'utf8');
  assert.match(varietyHtml, /Запись Госреестра подтверждает название и регионы допуска/);
  assert.match(varietyHtml, /Иллюстрация клубники/);
  assert.match(varietyHtml, /Урожайность<\/span><strong>—<\/strong>/);
});

test('проверенные допуски малины связывают сорт с городом через регион Госреестра', async () => {
  const catalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  const find = slug => catalog.cultivars.find(cultivar => cultivar.slug === slug);
  const zones = slug => find(slug).admissions.map(item => item.admission_region_number);
  assert.deepEqual(zones('meteor'), [1, 2, 3, 4, 5, 7]);
  assert.deepEqual(zones('peresvet'), [3, 4]);
  assert.deepEqual(zones('beglyanka'), [3]);
  assert.deepEqual(zones('zheltyy-gigant'), [2]);
  assert.deepEqual(zones('zolotye-kupola'), [3]);
  for (const slug of ['atlant', 'pingvin', 'oranzhevoe-chudo', 'zolotaya-osen']) {
    assert.deepEqual(zones(slug), Array.from({ length: 12 }, (_, index) => index + 1), slug);
    assert.deepEqual(find(slug).recommendations, [], slug);
  }
  const cityZones = [['kemerovo', 10], ['surgut', 10]];
  for (const [slug, zone] of cityZones) {
    const city = cities.find(item => item.slug === slug);
    assert.equal(catalog.regions.find(region => region.name_ru === city.region)?.admission_region_number, zone);
    const html = await readFile(join(root, 'podbor', slug, 'index.html'), 'utf8');
    assert.match(html, /Пингвин · допуск в Госреестре/);
    assert.match(html, /#page=419/);
  }
  for (const [slug, variety] of [['kaliningrad', 'Метеор'], ['tula', 'Пересвет']]) {
    const html = await readFile(join(root, 'podbor', slug, 'index.html'), 'utf8');
    assert.match(html, new RegExp(`${variety} · допуск в Госреестре`));
  }
});

test('новые записи Госреестра сохраняют точные зоны и источник', async () => {
  const catalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  const cultivar = slug => catalog.cultivars.find(item => item.slug === slug);
  const cases = [
    ['abrikosovaya', '9908145', 418, [3]],
    ['balzam', '8204616', 418, [2, 3, 4, 5, 6, 7, 10, 11]],
    ['zhuravlik', '8903751', 418, [4, 6, 7]],
    ['medvezhonok', '8262601', 419, [3]],
    ['skromnitsa', '8204594', 419, [2, 3, 4, 5, 6, 7, 10]],
    ['solnyshko', '7906838', 419, [3, 4, 6]]
  ];
  for (const [slug, code, page, zones] of cases) {
    const item = cultivar(slug);
    assert.deepEqual(item.admissions.map(row => row.admission_region_number), zones, slug);
    assert.ok(item.admissions.every(row => row.registry_entry_code === code && row.source_pdf_page === page), slug);
    assert.deepEqual(item.recommendations, [], slug);
  }
  for (const slug of ['bryanskoe-divo', 'evraziya', 'zhar-ptitsa', 'podarok-kashinu', 'poklon-kazakovu', 'rubinovoe-ozherele']) {
    assert.deepEqual(cultivar(slug).admissions.map(row => row.admission_region_number), Array.from({ length: 12 }, (_, i) => i + 1), slug);
  }
  assert.deepEqual(cultivar('polka').admissions, []);
});

test('Похвалинка связана с красной иллюстрацией, источниками, урожайностью и всеми регионами допуска', async () => {
  const catalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  const raspberryCount = catalog.cultivars.filter(item => item.crop_slug === 'raspberry').length;
  const strawberryCount = catalog.cultivars.filter(item => item.crop_slug === 'strawberry').length;
  assert.equal(raspberryCount, 48);
  assert.equal(strawberryCount, 38);

  const yubileinaya = catalog.cultivars.find(item => item.slug === 'yubileinaya-kulikova');
  const yubileinayaFacts = Object.fromEntries(yubileinaya.observations.map(item => [item.trait_code, item]));
  assert.equal(yubileinayaFacts.yield.value_number, 16.2);
  assert.equal(yubileinayaFacts.yield.unit, 'т/га');
  assert.equal(yubileinayaFacts.plant_productivity_g.value_number, 2750.2);
  assert.equal(yubileinayaFacts.plant_productivity_g.unit, 'г/куст');
  const yubileinayaHtml = await readFile(join(root, 'sorta', 'yubileinaya-kulikova', 'index.html'), 'utf8');
  assert.match(yubileinayaHtml, /урожайность составила 16,2 т\/га, биологическая продуктивность куста — 2750,2 г/);

  const arisha = catalog.cultivars.find(item => item.slug === 'arisha');
  assert.deepEqual(arisha.admissions.map(item => item.admission_region_number), [9]);
  const arishaHtml = await readFile(join(root, 'sorta', 'arisha', 'index.html'), 'utf8');
  assert.match(arishaHtml, /#page=417/);

  const solovushka = catalog.cultivars.find(item => item.slug === 'solovushka');
  assert.deepEqual(solovushka.admissions, []);
  assert.equal(solovushka.recommendations.length, 1);
  assert.equal(solovushka.recommendations[0].region_code, 'bryansk-oblast');
  assert.equal(solovushka.recommendations[0].basis_kind, 'regional_trial');

  const pohvalinka = catalog.cultivars.find(item => item.slug === 'pohvalinka');
  assert.ok(pohvalinka);
  assert.deepEqual(pohvalinka.admissions.map(item => item.admission_region_number), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.ok(pohvalinka.admissions.every(item => item.registry_entry_code === '8456207' && item.source_pdf_page === 418));
  assert.deepEqual(pohvalinka.recommendations, []);
  assert.ok(pohvalinka.observations.some(item => item.trait_code === 'yield' && item.value_text === '194 ц/га по данным заявителя' && item.value_max === null));

  const html = await readFile(join(root, 'sorta', 'pohvalinka', 'index.html'), 'utf8');
  assert.match(html, /Похвалинка/);
  assert.match(html, /Урожайность[\s\S]{0,100}194 ц\/га по данным заявителя/);
  assert.match(html, /8456207/);
  assert.match(html, /#page=418/);
  assert.match(html, /src="\/assets\/variety-pohvalinka\.webp" alt="Иллюстрация малины/);
  const tula = await readFile(join(root, 'podbor', 'tula', 'index.html'), 'utf8');
  assert.match(tula, /Похвалинка · допуск в Госреестре/);
});

test('три сорта клубники связаны с опытом ФНЦ Садоводства, Госреестром и отдельными иллюстрациями', async () => {
  const catalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  const expected = {
    darenka: { regions: [3, 4, 10, 11], code: '9705077', yield: 10.3, localRule: false },
    'zenga-zengana': { regions: [2, 3, 4, 5, 6, 7, 8, 9], code: '6950361', yield: 7.7, localRule: false },
    'desnyanka-kokinskaya': { regions: [4, 10], code: '7404999', yield: 9.4, localRule: true }
  };
  for (const [slug, facts] of Object.entries(expected)) {
    const cultivar = catalog.cultivars.find(item => item.slug === slug);
    assert.ok(cultivar, `Нет карточки ${slug}`);
    assert.deepEqual(cultivar.admissions.map(item => item.admission_region_number), facts.regions);
    assert.ok(cultivar.admissions.every(item => item.registry_entry_code === facts.code && item.source_pdf_page === 414));
    if (facts.localRule) {
      assert.deepEqual(cultivar.recommendations.map(rule => rule.region_code), ['orenburg-oblast']);
      assert.equal(cultivar.recommendations[0].basis_kind, 'regional_trial');
    } else {
      assert.deepEqual(cultivar.recommendations, []);
    }
    assert.ok(cultivar.observations.some(item => item.trait_code === 'yield' && item.value_number === facts.yield && item.unit === 'т/га'));
    assert.ok(cultivar.observations.filter(item => item.evidence && item.source_key === 'strawberry-orenburg-trial-2020-2021').every(item =>
      item.evidence.place_text === 'Оренбургская область' && item.evidence.period_from === '2020' && item.evidence.period_to === '2021'));

    const html = await readFile(join(root, 'sorta', slug, 'index.html'), 'utf8');
    assert.match(html, new RegExp(`src="/assets/variety-${slug}\\.webp" alt="Иллюстрация клубники`));
    assert.match(html, /Salimova\.pdf/);
    assert.match(html, /#page=414/);
    assert.match(html, new RegExp(facts.code));
  }
});

test('допуск Вима Кимберли показывается для Центрального и Центрально-Чернозёмного регионов', async () => {
  const catalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  const kimberli = catalog.cultivars.find(item => item.slug === 'kimberli');
  assert.deepEqual(kimberli.admissions.map(item => item.admission_region_number), [3, 5]);
  assert.ok(kimberli.admissions.every(item => item.registry_entry_code === '9154051' && item.source_pdf_page === 414));
  assert.deepEqual(kimberli.recommendations, []);
  for (const city of ['tula', 'belgorod']) {
    const html = await readFile(join(root, 'podbor', city, 'index.html'), 'utf8');
    assert.match(html, /Кимберли · допуск в Госреестре/);
    assert.match(html, /9154051/);
    assert.match(html, /#page=414/);
  }
});

test('допуск Самохвала из реестра распространяется на все регионы; местное испытание даёт отдельное правило', async () => {
  const catalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  const samohval = catalog.cultivars.find(item => item.slug === 'samohval');
  assert.deepEqual(samohval.admissions.map(item => item.admission_region_number), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.ok(samohval.admissions.every(item => item.registry_entry_code === '8456205' && item.source_pdf_page === 419));
  assert.deepEqual(samohval.recommendations.map(item => item.region_code), ['leningrad-oblast']);
  for (const city of ['tula', 'kaliningrad']) {
    const html = await readFile(join(root, 'podbor', city, 'index.html'), 'utf8');
    assert.match(html, /Самохвал · допуск в Госреестре/);
    assert.match(html, /8456205/);
    assert.match(html, /#page=419/);
  }
});

test('город показывает подбор и один сворачиваемый список Госреестра со ссылками на отзывы', async () => {
  const tula = await readFile(join(root, 'podbor', 'tula', 'index.html'), 'utf8');
  const query = new URLSearchParams({ city: 'Тула', region: 'Тульская область' }).toString().replaceAll('&', '&amp;');
  assert.ok(tula.indexOf('id="picker-form"') < tula.indexOf('class="section wrap verified-section"'));
  assert.match(tula, /<details class="verified-details"><summary>Посмотреть записи Госреестра<\/summary>/);
  assert.equal((tula.match(/class="section wrap verified-section"/g) || []).length, 1);
  assert.doesNotMatch(tula, /class="section wrap city-evidence"/);
  assert.ok(tula.includes(`href="/sorta/abrikosovaya/?${query}#gosreestr"`));
  assert.ok(tula.includes(`href="/sorta/abrikosovaya/?${query}#otzyvy"`));
  const arkhangelsk = await readFile(join(root, 'podbor', 'arkhangelsk', 'index.html'), 'utf8');
  assert.doesNotMatch(arkhangelsk, /Абрикосовая · допуск в Госреестре/);
});

test('страница отзывов содержит простую форму и публичный снимок без служебных данных', async () => {
  const html = await readFile(join(root, '/otzyvy/', 'index.html'), 'utf8');
  const js = await readFile(join(root, '/assets/reviews.js'), 'utf8');
  for (const name of ['display_name', 'region', 'cultivar_name', 'body']) {
    assert.match(html, new RegExp(`name="${name}"`));
  }
  assert.match(html, /data-reviews-enabled="false"/);
  assert.match(html, /<fieldset disabled>/);
  assert.doesNotMatch(html, /Приём отзывов откроется|локальной базой данных в России/);
  assert.doesNotMatch(html, /name="consent_/);
  assert.doesNotMatch(html, /name="(?:email|phone|address)"/);
  assert.doesNotMatch(html, /Код для удаления|review-withdrawal|withdrawal_token|Удалить свой отзыв/);
  assert.match(js, /textContent = review\.body/);
  assert.match(js, /parent_id: review\.id/);
  assert.match(js, /document\.createElement\('details'\)/);
  assert.match(js, /review-geo\.js/);
  assert.ok((await readFile(join(root, '/assets/review-geo.js'), 'utf8')).length > 0);
  assert.match(js, /Ответы · /);
  assert.doesNotMatch(js, /localStorage|sessionStorage|github\.com|api\.github\.com/);
  assert.doesNotMatch(js, /withdrawal_token|review-withdrawal|review-delete/);
  const snapshot = JSON.parse(await readFile(join(root, '/data/reviews.json'), 'utf8'));
  assert.equal(snapshot.schema_version, 1);
  assert.ok(Array.isArray(snapshot.reviews));
  for (const review of snapshot.reviews) {
    assert.deepEqual(Object.keys(review).sort(), [
      'body', 'created_at', 'cultivar_name', 'display_name', 'id', 'parent_id', 'published_at', 'region'
    ]);
  }
});
