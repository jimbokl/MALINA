import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { articles } from '../editorial.mjs';
import { newArticles20260926 } from '../editorial-2026-09-26.mjs';
import { cities } from '../cities.mjs';
import { varieties } from '../data.mjs';

const root = fileURLToPath(new URL('../../dist/', import.meta.url));
const routes = ['/', '/malina/', '/klubnika/', '/sorta/', '/sravnenie/malina/', '/sravnenie/klubnika/', '/rating/', '/podbor/', '/otzyvy/', '/goroda/', '/guide/', '/in-vitro/', '/proverka-partii/', '/about/',
  ...varieties.map(variety => `/sorta/${variety.slug}/`),
  '/zhurnal/', '/zhurnal/malina/', '/zhurnal/klubnika/', ...articles.map(article => `/zhurnal/${article.slug}/`)];

test('карточки сортов показывают только проверенные паспорта фактов', async () => {
  const polka = await readFile(join(root, 'sorta', 'polka', 'index.html'), 'utf8');
  const elan = await readFile(join(root, 'sorta', 'elan', 'index.html'), 'utf8');
  const joan = await readFile(join(root, 'sorta', 'joan-j', 'index.html'), 'utf8');
  assert.match(polka, /id="osnovaniya"/);
  assert.match(polka, /Вводное описание в карточке источника/);
  assert.match(polka, /<dt>Тип основания<\/dt><dd>Справочный источник<\/dd>/);
  assert.match(polka, /<time datetime="2026-09-26">26\.09\.2026<\/time>/);
  assert.match(polka, /Не подтверждает сроки, урожайность и пригодность/);
  assert.match(elan, /Подтверждает упоминание контейнеров/);
  assert.doesNotMatch(joan, /id="osnovaniya"/);
  assert.doesNotMatch(polka, /internal_sample_ref|private\/lot/);
});

test('каталог переключает иллюстрации и характеристики без подмены фото сорта', async () => {
  const html = await readFile(join(root, 'sorta', 'index.html'), 'utf8');
  assert.match(html, /data-catalog-view="illustrations" aria-pressed="true">Иллюстрации/);
  assert.match(html, /data-catalog-view="facts" aria-pressed="false">Характеристики/);
  assert.match(html, /id="catalog-results" data-view="illustrations"/);
  assert.match(html, /catalog-facts/);
  assert.match(html, /Источник: Исходная карточка/);
  assert.match(html, /ИИ-иллюстрация · не фотография сорта/);
  const js = await readFile(join(root, 'assets', 'site.js'), 'utf8');
  assert.match(js, /results\.dataset\.view = view/);
  assert.match(js, /aria-pressed/);
});

test('сравнение сортов отдаёт полезный HTML, источники и корректные границы данных', async () => {
  for (const [crop, slug] of [['малины', 'malina'], ['клубники', 'klubnika']]) {
    const html = await readFile(join(root, 'sravnenie', slug, 'index.html'), 'utf8');
    assert.match(html, new RegExp(`Сравнить сорта<br><em>${crop}\\.`));
    assert.match(html, /ВЫБЕРИТЕ ОТ 2 ДО 4/);
    assert.match(html, /Применимость к региону России не оценивалась/);
    assert.match(html, /comparison-data/);
    assert.match(html, /comparison\.js/);
    assert.match(html, /проверено 24\.09\.2026/);
  }
  const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8').catch(() => '');
  if (process.env.SITE_URL) {
    assert.match(sitemap, /\/sravnenie\/malina\//);
    assert.match(sitemap, /\/sravnenie\/klubnika\//);
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
  assert.match(cultivarGuide, /не подтверждают зимостойкость или урожайность сорта в России/);
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

test('статья о посадке объясняет различия культур и происхождение иллюстраций', async () => {
  const html = await readFile(join(root, 'zhurnal', 'posadka-sazhentsev-maliny-i-klubniki', 'index.html'), 'utf8');
  assert.match(html, /<h1>Как посадить саженцы малины и клубники без типичных ошибок<\/h1>/);
  assert.match(html, /<aside class="media-toc" aria-label="Содержание статьи">/);
  assert.match(html, /href="#section-6"/);
  assert.match(html, /сердечко видно/);
  assert.match(html, /Для конкретного региона России дополнительно нужны местные сведения/);
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
  assert.match(html, /не удостоверяет сорт, здоровье растений или будущий урожай/i);
  assert.match(html, /name="planting-stock"/);
  assert.match(html, /fps\.ucdavis\.edu\/strawberry\.cfm/);
  assert.match(html, /californiaagriculture\.org\/api\/v1\/articles\/112420-meristem-culture-for-elimination-of-strawberry-viruses\.pdf/);
  const js = await readFile(join(root, 'assets', 'lot-checklist.js'), 'utf8');
  assert.match(js, /это список документов для запроса, а не оценка качества партии/i);
  assert.match(js, /status\.textContent/);
  assert.match(js, /activeChecks\.filter/);
  assert.doesNotMatch(js, /fetch\(|localStorage|sessionStorage/);
});

test('страница In Vitro объясняет проверку партии без обещания оздоровления', async () => {
  const html = await readFile(join(root, 'in-vitro', 'index.html'), 'utf8');
  assert.match(html, /фитосанитарного тестирования/);
  assert.match(html, /Само слово In Vitro не подтверждает/);
  assert.match(html, /scielo\.cl\/pdf\/bres/);
});

test('карточки показывают источник и границы применимости данных', async () => {
  for (const route of routes.filter(route => route.startsWith('/sorta/') && route !== '/sorta/')) {
    const html = await readFile(join(root, route, 'index.html'), 'utf8');
    assert.match(html, /<title>[^<]+: описание сорта (малины|клубники), фото, урожайность и отзывы садоводов/);
    const variety = varieties.find(item => route === `/sorta/${item.slug}/`);
    if (variety.slug !== 'gusar') assert.match(html, /Проверенных данных для России нет/);
    assert.match(html, /Фото сорта пока не проверено/);
    assert.ok(html.includes(variety.source));
    assert.match(html, /Региональная пригодность в России пока не проверена|Региональные испытания в России для этой записи пока не подтверждены/);
    assert.match(html, /id="reviews-root"[^>]*data-cultivar=/);
    assert.match(html, /Отзывы о сорте/);
    assert.match(html, /name="cultivar_name" value=/);
  }
});

test('урожайность Гусара показана с источником и ограничениями, без обещания для участка', async () => {
  const html = await readFile(join(root, 'sorta', 'gusar', 'index.html'), 'utf8');
  const catalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  const gusar = catalog.cultivars.find(row => row.slug === 'gusar');
  const yieldRow = gusar.observations.find(row => row.trait_code === 'yield');
  assert.equal(yieldRow.value_number, 7);
  assert.equal(yieldRow.value_max, 9);
  assert.equal(yieldRow.unit, 'т/га');
  assert.equal(yieldRow.source_key, 'fnc-gusar');
  assert.equal(yieldRow.evidence.evidence_kind, 'reference_document');
  assert.match(html, /7–9 т\/га по описанию ФНЦ Садоводства/);
  assert.match(html, /<h3>7–9 т\/га<\/h3>/);
  assert.match(html, /условия измерения не указаны/);
  assert.match(html, /Не доказывает урожайность в конкретном регионе России/);
});

test('Азия опубликована с ограничением итальянского источника и без обещания урожая в России', async () => {
  const html = await readFile(join(root, 'sorta', 'aziya', 'index.html'), 'utf8');
  const catalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  const asia = catalog.cultivars.find(row => row.slug === 'aziya');
  assert.ok(asia);
  assert.match(html, /сведения из Италии: сроки, урожайность и пригодность для регионов России пока не проверены/);
  assert.match(html, /ИИ-иллюстрация · не фотография сорта/);
  assert.ok(asia.observations.every(row => row.source_key === 'geoplant-asia-nf421' && row.context_text.includes('России')));
  assert.equal(asia.recommendations.length, 0);
});

test('Мурано и Альба опубликованы с исходными наблюдениями без региональных рекомендаций', async () => {
  const catalog = JSON.parse(await readFile(join(root, 'data', 'catalog.json'), 'utf8'));
  for (const [slug, sourceKey] of [['murano', 'civ-murano-technical'], ['alba', 'geoplant-alba-nf311']]) {
    const html = await readFile(join(root, 'sorta', slug, 'index.html'), 'utf8');
    const cultivar = catalog.cultivars.find(row => row.slug === slug);
    assert.ok(cultivar);
    assert.match(html, /ИИ-иллюстрация · не фотография сорта/);
    assert.match(html, /урожайность и пригодность для регионов России пока не проверены/);
    assert.ok(cultivar.observations.length >= 2);
    assert.ok(cultivar.observations.every(row => row.source_key === sourceKey && row.context_text.includes('России')));
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
  assert.match(js, /params\.get\('city'\)/);
  assert.match(js, /params\.get\('region'\)/);
  assert.match(js, /regionInput\.value = region/);
  assert.match(js, /не подтверждает пригодность сорта/);
  assert.match(picker, /name="shelter" value="unknown" checked/);
  assert.match(picker, /name="drainage" value="unknown" checked/);
  assert.match(picker, /id="picker-conditions"/);
  assert.match(tula, /name="shelter" value="unknown" checked/);
  assert.match(js, /они не изменили список/);
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
  assert.match(html, /региональные правила подбора ещё не опубликованы/);
  assert.match(js, /не региональная рекомендация/);
  assert.match(html, /id="verified-status"/);
  assert.doesNotMatch(html, /id="verified-region"/);
  assert.match(verifiedJs, /querySelector\('#picker-form'\)/);
  assert.match(html, /assets\/verified-selector\.js/);
});

test('подбор связывает выбранные сорта со сравнением и сохраняет контекст города', async () => {
  const html = await readFile(join(root, '/podbor/tula/', 'index.html'), 'utf8');
  assert.match(html, /id="picker-form" data-city="Тула" data-region="Тульская область"/);
  assert.match(html, /id="picker-compare-link"/);
  assert.match(html, /class="picker-compare-checkbox" value="gusar"/);
  assert.match(html, /assets\/picker-compare\.js\?v=/);
});

test('публичный JSON подключается к собранному WASM и не выдумывает рекомендации', async () => {
  const catalog = await readFile(join(root, '/data/catalog.json'), 'utf8');
  const data = JSON.parse(catalog);
  assert.equal(data.schema_version, 1);
  assert.equal(data.cultivars.length, varieties.length);
  assert.ok(data.cultivars.every(cultivar => cultivar.recommendations.length === 0));
  const wasm = await readFile(join(root, '/assets/selector/malina_selector_bg.wasm'));
  assert.equal(wasm.subarray(0, 4).toString('hex'), '0061736d');
  const { initSync, select_varieties } = await import('../../dist/assets/selector/malina_selector.js');
  initSync({ module: wasm });
  const result = JSON.parse(select_varieties(catalog, JSON.stringify({ region_code: 'kaliningrad-oblast' })));
  assert.equal(result.total, 0);
  assert.deepEqual(result.matches, []);
  assert.equal(result.error, undefined);
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
  assert.match(html, /не гарантирует зимовку/);
  for (const city of ['kaliningrad', 'tula', 'kazan']) {
    const cityHtml = await readFile(join(root, 'podbor', city, 'index.html'), 'utf8');
    assert.match(cityHtml, /Гусар · допуск в Госреестре/);
    assert.match(cityHtml, /9902171/);
    assert.match(cityHtml, /#page=418/);
    assert.match(cityHtml, /не гарантирует зимовку и урожайность/);
  }
  const unrelatedCity = await readFile(join(root, 'podbor', 'arkhangelsk', 'index.html'), 'utf8');
  assert.doesNotMatch(unrelatedCity, /Гусар · допуск в Госреестре/);
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
