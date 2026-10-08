import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { varieties } from '../data.mjs';
import { articles } from '../editorial.mjs';
import { programmaticCultivars, normalizeQuery, addProgrammaticPages } from '../seo-programmatic.mjs';
import { newBotanicalArticles } from '../editorial-botanical-2026-10-08.mjs';
import { cultivarQueryAliases, matchCultivarQuery } from '../seo-query-intents.mjs';
import { ambiguousNameAnswer } from '../editorial-name-check-2026-10-08.mjs';
import { growerSources, cultivarReviewSources, cultivarPhotoReference, externalReviewsHtml } from '../seo-cultivar-resources.mjs';
import { externalReaderSources } from '../seo-reader-sources-2026-10-08.mjs';
import { seoPhotoSupplement } from '../seo-photo-supplement-2026-10-08.mjs';

test('SEO catalog adds unique cultivar identities with source-backed facts', () => {
  const added = programmaticCultivars(varieties);
  const slugs = new Set(varieties.map(item => item.slug));
  for (const item of added) {
    assert.match(item.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, item.name);
    assert.equal(slugs.has(item.slug), false, item.slug);
    slugs.add(item.slug);
    assert.ok(['verified', 'trade_description'].includes(item.status));
    if (item.status === 'trade_description') assert.ok(item.identity || item.limitations, item.name);
    assert.match(item.sourceUrl, /^https?:\/\//);
    assert.ok(item.paragraphs.some(text => text.length > 60), item.name);
    assert.ok(item.facts.length > 0, item.name);
  }
});

test('Tibetan raspberry separates botanical identities and local cultivation evidence', () => {
  const article = newBotanicalArticles.find(item => item.slug === 'tibetskaya-malina-kakoe-rastenie');
  const body = article.sections.flatMap(section => section.paragraphs).join(' ');
  assert.match(body, /Rubus rosifolius/);
  assert.match(body, /Rubus illecebrosus/);
  assert.match(body, /нельзя автоматически объединять/);
  assert.match(body, /Карелии|ПетрГУ/);
  assert.equal(article.sections[4].heading, 'Китайская, тайская и земляничная малина: проверка этикетки');
});

test('every new editorial link and citation refers to an existing target in the built article', async () => {
  const slugs = new Set(articles.map(article => article.slug));
  const all = articles.filter(article => article.reviewedIso === '2026-10-08');
  for (const article of all) {
    const html = await readFile(new URL(`../../dist/zhurnal/${article.slug}/index.html`, import.meta.url), 'utf8');
    for (const slug of article.relatedArticles || []) assert.ok(slugs.has(slug), `${article.slug}: ${slug}`);
    for (const slug of article.relatedVarieties || []) assert.ok(html.includes(`href="/sorta/${slug}/"`), `${article.slug}: ${slug}`);
    for (const section of article.sections) for (const index of section.sources || []) assert.ok(article.sources[index]?.url, `${article.slug}: ${index}`);
  }
});

test('query normalization preserves names while normalizing punctuation and ё', () => {
  assert.equal(normalizeQuery('  Конёк–Горбунок, фото! '), 'конек горбунок фото');
  assert.notEqual(normalizeQuery('Чёрный принц'), normalizeQuery('Чёрный лебедь'));
});

test('incomplete names receive an identity explanation without replacing confirmed cultivar names', () => {
  assert.equal(ambiguousNameAnswer('клубника елизавета описание сорта', 'strawberry')?.section, 1);
  assert.equal(ambiguousNameAnswer('клубника елизавета 2 описание сорта', 'strawberry'), undefined);
  assert.equal(ambiguousNameAnswer('клубника гигант русский f1', 'strawberry'), undefined);
  assert.equal(ambiguousNameAnswer('малина память кузьмина', 'raspberry')?.section, 2);
  assert.equal(ambiguousNameAnswer('малина новость кузьмина', 'raspberry'), undefined);
  assert.equal(ambiguousNameAnswer('прима клубника описание', 'strawberry')?.section, 6);
});

test('spelling variants find the cultivar without merging crop identities', () => {
  const crops = [...varieties, ...programmaticCultivars(varieties)];
  const candidates = crops.flatMap(item => cultivarQueryAliases(item).map(alias => ({ item, alias }))).sort((a, b) => b.alias.length - a.alias.length);
  assert.equal(matchCultivarQuery('клубника кабрило описание сорта', 'strawberry', candidates)?.item.slug, 'cabrillo');
  assert.equal(matchCultivarQuery('малина полка описание сорта', 'raspberry', candidates)?.item.slug, 'polka');
  assert.equal(matchCultivarQuery('клубника полка описание сорта', 'strawberry', candidates)?.item.slug, 'strawberry-polka');
  assert.equal(matchCultivarQuery('клубника сорта корона описание и фото', 'strawberry', candidates)?.item.slug, 'strawberry-korona');
});

test('named disease and symptom questions require diagnosis rather than a cultivar description', () => {
  const item = varieties.find(item => item.slug === 'polka');
  const candidates = cultivarQueryAliases(item).map(alias => ({ item, alias }));
  assert.equal(matchCultivarQuery('почему желтеют листья малины полка', 'raspberry', candidates), undefined);
  assert.equal(matchCultivarQuery('обработка малины полка от галлицы', 'raspberry', candidates), undefined);
  assert.equal(matchCultivarQuery('малина полка устойчивость к болезням описание сорта', 'raspberry', candidates)?.item.slug, 'polka');
});

test('programmatic renderer refuses to overwrite an existing route', () => {
  const first = programmaticCultivars(varieties)[0];
  assert.ok(first);
  assert.throws(() => addProgrammaticPages({ pages: new Map([[`/sorta/${first.slug}/`, 'original']]), paths: [], layout: value => value.body, varieties, catalog: { cultivars: [], regions: [] } }), /route collides/);
});

test('external source records attach to one existing cultivar and keep author/date provenance', () => {
  const all = [...varieties, ...programmaticCultivars(varieties)];
  for (const source of [...growerSources, ...externalReaderSources]) {
    const slug = source.cultivarSlug || source.slug;
    assert.ok(all.some(item => item.slug === slug && item.cropKey === source.cropKey), `${source.name}: ${slug}`);
    assert.match(source.url, /^https:\/\//);
    assert.match(source.checkedIso, /^2026-10-08$/);
    if (source.authors) assert.ok(source.authors.every(value => value.author && (/^\d{4}-\d{2}-\d{2}$/.test(value.date) || (value.date == null && source.publishedDateStatus === 'not_displayed'))), source.url);
    else {
      assert.ok(source.author, source.url);
      if (source.kind !== 'named_photo_only' || source.publishedIso) assert.match(source.publishedIso, /^\d{4}-\d{2}-\d{2}$/, source.url);
    }
  }
  for (const slug of Object.keys(seoPhotoSupplement)) assert.ok(all.some(item => item.slug === slug), slug);
});

test('named photos alone do not become reader reviews or aggregate ratings', () => {
  const malvina = varieties.find(item => item.slug === 'malvina');
  assert.ok(cultivarPhotoReference(malvina));
  const reviews = cultivarReviewSources(malvina);
  assert.ok(reviews.every(source => source.kind !== 'named_photo_only'));
  assert.ok(reviews.some(source => source.url === 'https://dachaotzyv.ru/klubnika-malvina/'));
  const asia = varieties.find(item => item.slug === 'aziya');
  const html = externalReviewsHtml(asia);
  assert.match(html, /Ирина Топчий/);
  assert.match(html, /11\.06\.2023/);
  assert.match(html, /7dach\.ru\/Roselin/);
  assert.doesNotMatch(html, /AggregateRating|application\/ld\+json|ratingValue/);
});

test('photo coverage includes licensed source images while excluding illustrations and another crop', () => {
  const malga = varieties.find(item => item.slug === 'malga');
  const photo = cultivarPhotoReference(malga);
  assert.equal(photo.kind, 'licensed_local_cultivar_photo');
  assert.equal(photo.file, 'variety-photo-malga-patent.webp');
  const siriya = varieties.find(item => item.slug === 'siriya');
  const siriyaPhoto = cultivarPhotoReference(siriya);
  assert.equal(siriyaPhoto.url, 'https://www.meiosis.co.uk/fruit_types/syria/');
  assert.notEqual(siriyaPhoto.kind, 'licensed_local_cultivar_photo');
  assert.equal(siriyaPhoto.file, undefined);
  assert.equal(cultivarPhotoReference({ slug: 'kleri', name: 'Клери', cropKey: 'raspberry' }), null);
});
