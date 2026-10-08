import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { varieties } from '../data.mjs';
import { articles } from '../editorial.mjs';
import { researchedCultivars } from '../seo-cultivar-research.mjs';
import { researchedStrawberryTail } from '../seo-cultivar-strawberry-tail.mjs';
import { normalizeQuery, programmaticCultivars, cropCatalogPath, regionalCatalogPath, cultivarPath } from '../seo-programmatic.mjs';
import { cultivarPhotoReference, cultivarReviewSources } from '../seo-cultivar-resources.mjs';
import { cultivarQueryAliases, matchCultivarQuery } from '../seo-query-intents.mjs';
import { ambiguousNameAnswer } from '../editorial-name-check-2026-10-08.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const research = join(root, 'research/wordstat/wordcraft-2026-10-08');
const csv = await readFile(join(research, 'queries-all.csv'), 'utf8');
function parseCsv(text) {
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(field); field = ''; }
    else if (c === '\n' && !quoted) { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  const headers = rows.shift().map(value => value.replace(/^\ufeff/, ''));
  return rows.filter(row => row.length === headers.length).map(row => Object.fromEntries(headers.map((header, i) => [header, row[i]])));
}
const input = parseCsv(csv).filter(row => ['LOW', 'AVERAGE'].includes(row.competition_code));
const catalog = JSON.parse(await readFile(join(root, 'dist/data/catalog.json'), 'utf8'));
const gardenAudit = new Map(JSON.parse(await readFile(join(research, 'garden-intent-audit.json'), 'utf8')).map(row => [row.query, row]));
const allCultivars = [...varieties, ...programmaticCultivars(varieties)];
const extraData = [...researchedCultivars, ...researchedStrawberryTail];
const cultivarCandidates = allCultivars.flatMap(item => {
  const record = catalog.cultivars.find(value => value.slug === item.slug);
  const extras = extraData.filter(value => ['verified', 'trade_description'].includes(value.status) && (value.slug === item.slug || (value.cropKey === item.cropKey && normalizeQuery(value.name) === normalizeQuery(item.name))));
  return cultivarQueryAliases(item, record, extras).map(alias => ({ item, alias }));
}).sort((a, b) => b.alias.length - a.alias.length);
const articleByPath = new Map(articles.map(article => [`/zhurnal/${article.slug}/`, article]));
const publishedReviews = JSON.parse(await readFile(join(root, 'db/public/reviews.json'), 'utf8')).reviews || [];
const sourceRoot = 'https://malinaklubnika.ru';
const cropFor = q => /клубник|земляник/.test(q) ? 'strawberry' : /малин/.test(q) ? 'raspberry' : /виктори/.test(q) ? 'strawberry' : null;
const mapArticle = (slug, section = 1) => ({ disposition: 'covered', canonicalPath: `/zhurnal/${slug}/`, answerAnchor: `section-${section}`, evidenceKind: 'editorial_answer' });
const result = [];
for (const row of input) {
  const q = normalizeQuery(row.query);
  const audit = gardenAudit.get(row.query);
  let resolution;
  if (/болезн(?:и|ь|ью|ей|ях) (?:печени|почек)|желчекаменн|можно (?:ли |есть |кушать ).*при (?:диабет|гастрит|панкреатит|беременн|гв|язв)/.test(q)) resolution = { disposition: 'out_of_scope', reason: 'Медицинский вопрос об употреблении ягод; не садоводческий интент.' };
  else if (audit?.disposition === 'out_of_scope') resolution = { disposition: 'out_of_scope', reason: audit.reason };
  else if (audit?.disposition !== 'covered' && ['off_topic_gambling', 'adjacent_food', 'off_topic_or_malformed', 'adjacent_health', 'ambiguous_brand'].includes(row.scope)) resolution = { disposition: 'out_of_scope', reason: `Исходная проверка интента: ${row.scope}.` };
  else {
    const crop = cropFor(q);
    const ambiguous = ambiguousNameAnswer(q, crop);
    const match = matchCultivarQuery(q, crop, cultivarCandidates);
    if (ambiguous) resolution = { ...mapArticle(ambiguous.slug, ambiguous.section), identityStatus: 'ambiguous_name', requestedResources: [/фото|картин|изображ/.test(q) && 'photo', /отзыв/.test(q) && 'gardener_reviews'].filter(Boolean), availableResources: [], missingResources: [/фото|картин|изображ/.test(q) && 'photo', /отзыв/.test(q) && 'gardener_reviews'].filter(Boolean) };
    else if (match) resolution = { disposition: 'covered', canonicalPath: cultivarPath(match.item), answerAnchor: /отзыв/.test(q) ? (varieties.some(item => item.slug === match.item.slug) ? 'otzyvy' : 'seo-reviews') : /фото|картин|изображ/.test(q) ? 'seo-photo' : /уход|выращ|посад|сажать|обрез|полив|размнож/.test(q) ? 'seo-care' : 'seo-opisanie', evidenceKind: 'cultivar_passport', cultivarSlug: match.item.slug, matchedAlias: match.alias };
    else if (/(?:виды|видов|разновидност|какие виды)/.test(q) && crop) resolution = mapArticle(crop === 'raspberry' ? 'vidy-maliny-nazvaniya-i-fotografii' : 'vidy-klubniki-nazvaniya-i-fotografii', /сорт|ремонтант|нсд|ксд/.test(q) ? 3 : 1);
    else if (/бактериальн.*(?:ожог|пятнист)|(?:ожог|пятнист).*бактериальн/.test(q) && crop === 'strawberry') resolution = mapArticle('bakterialnaya-pyatnistost-klubniki-chto-proverit', /пятн|лист/.test(q) ? 2 : 1);
    else if (/хорус/.test(q) && crop === 'raspberry') resolution = mapArticle('fitosporin-horus-narodnye-sredstva-i-smesi', 2);
    else if (/больн/.test(q) && /ягод/.test(q) && crop === 'raspberry') resolution = mapArticle('sohnut-i-gniyut-yagody-maliny', 3);
    else if (/тибетск|розолистн|соблазнительн|rubus rosifolius|rubus illecebrosus/.test(q)) resolution = mapArticle('tibetskaya-malina-kakoe-rastenie', /выращ|уход|посад|сажать|размнож/.test(q) ? 3 : /отзыв/.test(q) ? 4 : /фото|описан/.test(q) ? 2 : 1);
    else if (/норвежск|скандинавск|мяу мяу|розалина|малинника/.test(q)) resolution = mapArticle('tibetskaya-malina-kakoe-rastenie', 6);
    else if (/гималайск|азиатск.*малин|малин.*азиатск|ползуч.*малин|малин.*ползуч/.test(q)) resolution = mapArticle('tibetskaya-malina-kakoe-rastenie', 7);
    else if (/малиника|(?:китайск|тайск|земляничн).*малин|малин.*(?:китайск|тайск|земляничн)|гибрид.*малин.*клубник|гибрид.*клубник.*малин/.test(q)) resolution = mapArticle('tibetskaya-malina-kakoe-rastenie', 5);
    else if (/(синяя|голубая) малина|малин[аы] (синяя|голубая)/.test(q)) resolution = mapArticle('sinyaya-golubaya-i-chernaya-malina');
    else if (/японск.*малин|малин.*японск/.test(q)) resolution = mapArticle('yaponskaya-malina-rubus-phoenicolasius');
    else if (/почему.*кисл|кисл.*ягод|вкус малины/.test(q) && crop === 'raspberry') resolution = mapArticle('pochemu-malina-kislaya-vkus-i-zrelost', /вкус малины/.test(q) ? 2 : 1);
    else if (/плохо.*раст|слабо.*раст/.test(q) && crop === 'raspberry') resolution = mapArticle('malina-ploho-rastet-chto-proverit');
    else if (/хлороз/.test(q) && crop === 'raspberry') resolution = mapArticle('hloroz-maliny-prichiny-i-proverka', /леч|дела|борьб/.test(q) ? 2 : 1);
    else if (/утолщ|шишк|нарост/.test(q) && /стеб|ствол|побег/.test(q) && crop === 'raspberry') resolution = mapArticle('gallitsa-na-maline-vzdutiya');
    else if (/галлиц/.test(q) && crop === 'raspberry') resolution = mapArticle('gallitsa-na-maline-vzdutiya', /борьб|леч|дела|обработ/.test(q) ? 2 : 1);
    else if (/(?:малинов|малинн).*мух|мух.*малин/.test(q)) resolution = mapArticle('malinovaya-muha-i-vyanushchie-pobegi', /борьб|леч|дела|обработ/.test(q) ? 2 : 1);
    else if (/молод.*побег.*(?:вян|сох)|(?:вян|сох).*молод.*побег/.test(q) && crop === 'raspberry') resolution = mapArticle('malinovaya-muha-i-vyanushchie-pobegi', 3);
    else if (/монилиоз/.test(q) && crop === 'raspberry') resolution = mapArticle('sohnut-i-gniyut-yagody-maliny', 1);
    else if (/сер.*гнил|гни.*ягод|ягод.*гни|сох.*ягод|ягод.*сох/.test(q) && crop === 'raspberry') resolution = mapArticle('sohnut-i-gniyut-yagody-maliny', /сер.*гнил/.test(q) ? 2 : 3);
    else if (/похож.*малин|малин.*похож/.test(q) && /ягод|растени/.test(q)) resolution = mapArticle('listya-maliny-kak-vyglyadyat', 4);
    else if (/таежн.*малин|малин.*таежн/.test(q)) resolution = mapArticle('listya-maliny-kak-vyglyadyat', 5);
    else if (/^(?:лист|листья|листочки) малины(?: фото| описание| как выглядят)?$/.test(q)) resolution = mapArticle('listya-maliny-kak-vyglyadyat', 1);
    else if (/листь.*обожж|обожж.*листь/.test(q) && crop === 'raspberry') resolution = mapArticle('listya-maliny-kak-vyglyadyat', 2);
    else if (/желте|желт.*лист|лист.*желт/.test(q) && crop === 'raspberry') resolution = mapArticle('zhelteyut-listya-maliny-chto-proverit', /дела|почему|причин/.test(q) ? 2 : 1);
    else if (/желте|красне|сох|увяд|вян/.test(q) && (crop === 'strawberry' || /виктори/.test(q))) resolution = mapArticle('zhelteet-krasneet-i-sohnet-klubnika', /красне/.test(q) ? 2 : /сох|увяд|вян/.test(q) ? 3 : 1);
    else if (/червив|черви|личин.*ягод/.test(q) && crop === 'raspberry') resolution = mapArticle('bolezni-i-vrediteli-maliny-priznaki', 4);
    else if (/обработ/.test(q) && /виктори/.test(q)) resolution = mapArticle('obrabotka-klubniki-i-maliny-po-sezonu', /весн/.test(q) ? 1 : /цвет/.test(q) ? 2 : /плод|ягод/.test(q) ? 3 : /осен|после/.test(q) ? 4 : 5);
    else if (/трипс/.test(q) && crop === 'strawberry') resolution = mapArticle('tripsy-na-klubnike-priznaki', /борьб|обработ|леч/.test(q) ? 3 : 1);
    else if (/вредител/.test(q) && crop === 'strawberry' && !/сорт/.test(q)) resolution = mapArticle('vrediteli-klubniki-kak-razlichit', /борьб|обработ|защит/.test(q) ? 4 : 1);
    else if (/тл[яию]|тлей/.test(q) && crop === 'raspberry') resolution = mapArticle('tlya-na-maline-chto-delat');
    else if (/мозаич|мозаик|курчав/.test(q) && crop === 'raspberry') resolution = mapArticle('mozaika-i-kurchavost-maliny', /леч|дела|борьб/.test(q) ? 2 : 1);
    else if (/парша|махров/.test(q) && crop === 'raspberry') resolution = mapArticle('mozaika-i-kurchavost-maliny', 3);
    else if (/ведьмин.*метл|метельчат|израстан/.test(q) && crop === 'raspberry') resolution = mapArticle('bolezni-i-vrediteli-maliny-priznaki', 3);
    else if (/пятн/.test(q) && crop === 'raspberry') resolution = mapArticle(/стеб|ствол|побег/.test(q) ? 'didimella-maliny-priznaki-i-proverka' : 'bolezni-i-vrediteli-maliny-priznaki', /стеб|ствол|побег/.test(q) ? 2 : 2);
    else if (/болезн|заболеван|заболел|болеет|болеют|больн|грибок|вредител/.test(q) && crop === 'raspberry') resolution = mapArticle('bolezni-i-vrediteli-maliny-priznaki', /леч|обработ|защит|борьб/.test(q) ? 5 : 1);
    else if (/болезн|заболеван|заболел|болеет|болеют|больн|грибок|пятн/.test(q) && (crop === 'strawberry' || /виктори/.test(q))) resolution = mapArticle('bolezni-klubniki-priznaki-i-proverka', /фото|картин|изображ/.test(q) ? 6 : /пятн/.test(q) ? 2 : /обработ|леч|защит/.test(q) ? 5 : 1);
    else if (audit?.disposition === 'covered' && articleByPath.has(audit.canonicalPath)) {
      const article = articleByPath.get(audit.canonicalPath);
      const section = article.sections.findIndex(section => section.heading === audit.sectionHeading);
      resolution = section < 0 ? { disposition: 'gap', reason: `В статье отсутствует проверенный раздел: ${audit.sectionHeading}` } : { disposition: 'covered', canonicalPath: audit.canonicalPath, answerAnchor: `section-${section + 1}`, evidenceKind: 'editorial_answer', reason: audit.reason };
    } else if (crop && /сорт|сладк|вкусн|крупн|урожайн|ранн|поздн|лучш|зимостой|морозостой|устойчив|хорош|рейтинг|для |выбрать|ремонтант|фото.*описание/.test(q)) {
      let region = /подмосков|московск/.test(q) ? 3 : /урал|екатеринбург|челябинск|перми|пермск/.test(q) ? 9 : /сибир|новосибир|алта[йя]/.test(q) ? 10 : /ленинград|петербург|северо запад|калининград/.test(q) ? 2 : /краснодар|ростов|северн.*кавказ/.test(q) ? 6 : /саратов|волгоград|астрахан/.test(q) ? 8 : /удмурт|нижегород|киров/.test(q) ? 4 : /самар|татар/.test(q) ? 7 : null;
      const generic = /^(?:(?:ремонтантная|летняя|желтая|красная|черная|садовая|ранняя|поздняя|крупная|сладкая|новые|лучшие|сладкие|крупные|урожайные|ремонтантные|ранние|поздние|летние|зимостойкие|красные|желтые|бесшипные|морозостойкие|для|отзывы|фото|описание|сорта|сорт|малина|малины|малину|клубника|клубники|клубнику|земляника|земляники|землянику|и|с|в|на|о|без|купить|какие|какой|самые|самый|крупноплодная|крупноплодные|названия|названиями|название|характеристика|характеристики|обзор|рейтинг|топ|10|5|2024|2025|2026|подмосковья|подмосковье|подмосковью|урала|урале|сибири|сибирь|россии|регионов|для|средней|полосы|плетистая|штамбовая|не|ремонтантная|обычная|даче|сад|сада|вкуса|посадки|открытого|грунта|болезням|устойчивая|устойчивые|новинки|ремонтантной|ремонтантных|летних|летней|ранних|ранней|поздних|поздней|сладкой|сладких|крупной|крупных|желтой|желтых|черной|черных|красной|красных|лучший|лучшая|самая|самое|самых|новых|подмосковный|московской|области|уральские|сибирские|краснодарского|края|ленинградской|калининградской|ростовской|саратовской|самарской|удмуртии|удмуртской|республике|татарстана|алтая|пермского|пермском|алтайского|новосибирской|нижегородской|кировской|волгоградской|астраханской|плодоношения|нейтрального|короткого|дня|нсд|ксд|описанием|описания|фотографиями|фотографиями|фотографии|садоводов|виктория|виктории|викторию|вкусная|вкусные|вкусный|вкусных|сладкий|крупный|крупноплодной|крупноплодных|урожайная|урожайный|лучших|хорошая|какая|какую|высоким|урожаем|ягодой|юга|юге|северо|запада|северо|запад|ленобласти|лен|обл|дерево|карликовая|низкорослая|самых|средняя|среднюю|сортов|лучше|хорошей|хорошую|хороший|хорошие|хороших|выбрать|сажать|жароустойчивые|восточной|по|отзывам)\s?)+$/.test(q);
      if (region && generic) resolution = { disposition: 'covered', canonicalPath: regionalCatalogPath(crop), answerAnchor: `region-${region}`, evidenceKind: 'regional_admissions_and_trials' };
      else if (generic) resolution = { disposition: 'covered', canonicalPath: cropCatalogPath(crop), answerAnchor: /ремонтант|летн|нейтральн|короткого.*дн/.test(q) ? 'tipy' : /урожайн/.test(q) ? 'urozhay' : /крупн/.test(q) ? 'razmer' : /сладк|вкусн/.test(q) ? 'vkus' : /ранн|поздн|созре/.test(q) ? 'sroki' : /устойчив|зимостой|морозостой/.test(q) ? 'ustoychivost' : 'catalog', evidenceKind: 'catalog_comparison' };
    }
    if (!resolution) resolution = { disposition: 'gap', reason: audit?.reason || 'Нужен конкретный ответ или проверка сортовой идентичности.' };
  }
  if (resolution.evidenceKind === 'cultivar_passport') {
    const item = allCultivars.find(value => value.slug === resolution.cultivarSlug);
    const extras = extraData.filter(value => ['verified', 'trade_description'].includes(value.status) && (value.slug === item.slug || (value.cropKey === item.cropKey && normalizeQuery(value.name) === normalizeQuery(item.name))));
    const photo = cultivarPhotoReference(item, extras.find(value => value.photoUrl));
    const localReviews = publishedReviews.some(review => normalizeQuery(review.cultivar_name) === normalizeQuery(item.name) && (!review.status || review.status === 'published'));
    const externalReviews = cultivarReviewSources(item);
    const hasReviews = localReviews || externalReviews.length > 0;
    resolution.requestedResources = [/фото|картин|изображ/.test(q) && 'photo', /отзыв/.test(q) && 'gardener_reviews'].filter(Boolean);
    resolution.availableResources = [...(photo ? ['photo'] : []), ...(hasReviews ? ['gardener_reviews'] : [])];
    resolution.missingResources = resolution.requestedResources.filter(value => !resolution.availableResources.includes(value));
    if (photo) {
      resolution.photoSourceUrl = photo.url;
      resolution.photoSourceKind = photo.kind || 'external_cultivar_photo';
      if (photo.file) resolution.photoAssetPath = `/assets/${photo.file}`;
    }
    if (externalReviews.length) resolution.reviewSourceUrls = externalReviews.map(source => source.url);
    resolution.reviewResourceKinds = [...(localReviews ? ['malina_moderated_review'] : []), ...new Set(externalReviews.map(source => source.kind || 'grower_diary'))];
  }
  result.push({ query: row.query, demand: Number(row.demand), clicks: Number(row.clicks), competition_code: row.competition_code, originalScope: row.scope, cluster: row.cluster, ...resolution, ...(resolution.canonicalPath ? { canonicalUrl: sourceRoot + resolution.canonicalPath } : {}) });
}
const missingResourceCounts = Object.fromEntries(['photo', 'gardener_reviews'].map(resource => [resource, result.filter(row => row.missingResources?.includes(resource)).length]));
const counts = Object.fromEntries(['covered', 'gap', 'out_of_scope'].map(status => [status, result.filter(row => row.disposition === status).length]));
const ranked = result.filter(row => row.disposition === 'covered').sort((a, b) =>
  (a.competition_code === 'LOW' ? 0 : 1) - (b.competition_code === 'LOW' ? 0 : 1) || b.demand - a.demand || a.query.localeCompare(b.query, 'ru'));
const csvField = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const csvRows = (headers, rows) => '\ufeff' + [headers, ...rows].map(row => row.map(csvField).join(',')).join('\n') + '\n';
const queryHeaders = ['query', 'monthly_users_exact_form', 'monthly_search_clicks', 'competition', 'canonical_url', 'answer_anchor', 'answer_type', 'missing_resources', 'photo_source_url', 'review_source_urls', 'review_resource_kinds'];
const queryRow = row => [row.query, row.demand, row.clicks, row.competition_code === 'LOW' ? 'Низкая' : 'Умеренная', row.canonicalUrl, row.answerAnchor, row.evidenceKind, (row.missingResources || []).join('; '), row.photoSourceUrl, (row.reviewSourceUrls || []).join('; '), (row.reviewResourceKinds || []).join('; ')];
await writeFile(join(research, 'covered-queries-low-moderate.csv'), csvRows(queryHeaders, ranked.map(queryRow)));
await writeFile(join(research, 'queries-missing-resources.csv'), csvRows(queryHeaders, ranked.filter(row => row.missingResources?.length).map(queryRow)));
await writeFile(join(research, 'queries-out-of-scope.csv'), csvRows(['query', 'monthly_users_exact_form', 'competition', 'reason'], result.filter(row => row.disposition === 'out_of_scope').map(row => [row.query, row.demand, row.competition_code, row.reason])));
await writeFile(join(research, 'query-coverage.json'), JSON.stringify({ checkedAt: '2026-10-08', source: 'queries-all.csv', metric: 'average monthly users for exact query, previous year', records: result }, null, 2) + '\n');
await writeFile(join(research, 'coverage-summary.json'), JSON.stringify({ checkedAt: '2026-10-08', input: input.length, counts, complete: counts.gap === 0, mappingComplete: counts.gap === 0, completionScope: 'canonical_routes_and_answer_anchors', resourceComplete: result.every(row => !row.missingResources?.length), queriesWithMissingResources: result.filter(row => row.missingResources?.length).length, missingResourceCounts, canonicalPages: new Set(result.filter(row => row.disposition === 'covered').map(row => row.canonicalPath)).size }, null, 2) + '\n');
await writeFile(join(research, 'coverage-gaps.tsv'), 'query\tdemand\tcluster\treason\n' + result.filter(row => row.disposition === 'gap').map(row => [row.query, row.demand, row.cluster, row.reason].join('\t')).join('\n') + '\n');
console.log(JSON.stringify({ input: input.length, ...counts }));
if (process.argv.includes('--require-complete') && counts.gap) process.exitCode = 1;
