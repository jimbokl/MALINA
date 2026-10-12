#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { varieties } from '../../../site/data.mjs';
import { cultivarQueryAliases, isDiagnosticQuery, matchCultivarQuery } from '../../../site/seo-query-intents.mjs';
import { normalizeQuery, cultivarPath } from '../../../site/seo-programmatic.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const [snapshotPath, oldCsvPath] = process.argv.slice(2);
if (!snapshotPath || !oldCsvPath) throw new Error('Usage: node build-report.mjs <private-dimensions-all.json> <previous-query-intents.csv>');
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
const tables = snapshot.tables;
const table = header => tables.find(rows => rows?.[0]?.[0] === header);
const number = value => Number(String(value ?? '').replace(/\u00a0/g, ' ').replace('%', '').replace(',', '.').trim()) || 0;
const metrics = row => ({ clicks: number(row[1]), impressions: number(row[2]), ctr_percent: number(row[3]), position: number(row[4]) });
const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const writeCsv = (filename, rows, columns) => fs.writeFileSync(path.join(here, filename), [columns.map(csvCell).join(','), ...rows.map(row => columns.map(key => csvCell(row[key])).join(','))].join('\n') + '\n');
const absoluteUrl = route => `https://malinaklubnika.ru${route}`;
const items = varieties.map(item => ({ item, aliases: cultivarQueryAliases(item, item).map(normalizeQuery) }));
const candidates = items.flatMap(({item, aliases}) => aliases.map(alias => ({item, alias})));
const byQuery = table('Популярные запросы');
const byPages = table('Популярные страницы');
const byDays = table('День');
const byDevices = table('Устройство');
for (const [name, rows] of [['queries',byQuery],['pages',byPages],['days',byDays],['devices',byDevices]]) if (!rows) throw new Error(`Missing GSC table: ${name}`);

const oldText = fs.readFileSync(oldCsvPath, 'utf8').replace(/^\uFEFF/, '');
const parseCsv = text => {
  const lines = text.trimEnd().split(/\r?\n/);
  const parseLine = line => { const a=[]; let s='',q=false; for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&line[i+1]==='"'&&q){s+='"';i++;}else if(c==='"')q=!q;else if(c===','&&!q){a.push(s);s='';}else s+=c;}a.push(s);return a; };
  const headers=parseLine(lines[0]); return lines.slice(1).map(line=>Object.fromEntries(parseLine(line).map((v,i)=>[headers[i],v])));
};
const oldRows = parseCsv(oldText);
const oldSet = new Set(oldRows.map(row => normalizeQuery(row.query)));
const queryRows = byQuery.slice(1).map(row => {
  const query = row[0].trim();
  const normalized = normalizeQuery(query);
  const crop = /клубник|земляник/.test(normalized) ? 'strawberry' : /малин/.test(normalized) ? 'raspberry' : undefined;
  const matched = matchCultivarQuery(normalized, crop, candidates);
  const allMatched = candidates.filter(candidate => (!crop || candidate.item.cropKey === crop) && (` ${normalized} `).includes(` ${candidate.alias} `));
  const slugs = [...new Set(allMatched.map(x => x.item.slug))];
  let intent, canonicalUrl='', mappingStatus='manual_review', confidence='low';
  if (matched && slugs.length === 1) {
    intent = matched.item.cropKey === 'raspberry' ? 'описание и выбор сорта малины' : 'описание и выбор сорта клубники';
    canonicalUrl = absoluteUrl(cultivarPath(matched.item)); mappingStatus='mapped_cultivar_alias'; confidence='high';
  } else if (slugs.length > 1) {
    intent='неоднозначное совпадение названий'; mappingStatus='ambiguous_cultivar_alias';
  } else if (isDiagnosticQuery(normalized)) {
    intent='симптомы или защита растений'; canonicalUrl=absoluteUrl('/zhurnal/zhelteyut-listya-maliny-chto-proverit/');
    mappingStatus='topic_candidate_review'; confidence='low';
  } else if (/пересадк.*клубник/.test(normalized)) {
    intent='пересадка клубники'; canonicalUrl=absoluteUrl('/zhurnal/peresadka-klubniki-osenyu-usloviya/'); mappingStatus='mapped_topic_by_question'; confidence='medium';
  } else if (/усов.*клубник|как сажать усы/.test(normalized)) {
    intent='размножение клубники усами'; canonicalUrl=absoluteUrl('/zhurnal/usy-klubniki-udalyat-ili-ukorenyat/'); mappingStatus='mapped_topic_by_question'; confidence='medium';
  } else if (/полив.*малин|малин.*полив/.test(normalized)) {
    intent='полив малины'; canonicalUrl=absoluteUrl('/zhurnal/poliv-i-mulcha-maliny/'); mappingStatus='mapped_topic_by_question'; confidence='medium';
  } else if (/in vitro/.test(normalized)) {
    intent='значение термина in vitro'; canonicalUrl=absoluteUrl('/zhurnal/kak-vybrat-sazhentsy-klubniki/'); mappingStatus='topic_candidate_review'; confidence='low';
  } else if (/подмосков|ураль|сибир/.test(normalized) && /сорт|урожайн|выбрат/.test(normalized)) {
    intent='региональный выбор сорта'; canonicalUrl=absoluteUrl('/sorta/'); mappingStatus='topic_candidate_review'; confidence='medium';
  } else if (/интернет магазин|купить|саженц/.test(normalized)) {
    intent='покупка саженцев'; canonicalUrl=absoluteUrl('/zhurnal/kak-vybrat-i-kupit-sazhency-maliny-i-klubniki/'); mappingStatus='topic_candidate_review'; confidence='medium';
  } else if (/малина/.test(normalized)) {
    intent='общий запрос о малине'; canonicalUrl=absoluteUrl('/sorta/malina/'); mappingStatus='topic_candidate_review'; confidence='low';
  } else if (/клубник|земляник/.test(normalized)) {
    intent='общий запрос о клубнике'; canonicalUrl=absoluteUrl('/sorta/klubnika/'); mappingStatus='topic_candidate_review'; confidence='low';
  } else {
    intent='чужой бренд, другой объект или неясный вопрос'; mappingStatus='unconfirmed_no_canonical';
  }
  return {query, normalized_query:normalized, ...metrics(row), intent, canonical_url:canonicalUrl, mapping_status:mappingStatus, mapping_confidence:confidence, prior_snapshot_exact_form:oldSet.has(normalized)?'yes':'no', new_in_current_snapshot:oldSet.has(normalized)?'no':'yes'};
});

const pageRows = byPages.slice(1).map(row => {
  const raw = row[0].replace(/\s+Копировать URL в буфер обмена.*$/s,'').trim();
  let parsed; try { parsed = new URL(raw); } catch { parsed = null; }
  const pathOnly = parsed ? decodeURI(parsed.pathname) : '';
  const hadQuery = Boolean(parsed?.search);
  return {raw_page_url:raw, ...metrics(row), observed_scheme:parsed?.protocol.replace(':','')||'', observed_host:parsed?.host||'', observed_path:pathOnly, observed_query_string:parsed?.search||'', path_without_query:pathOnly, has_query_variant:hadQuery?'yes':'no', historical_http_url:parsed?.protocol==='http:'?'yes':'no', mapping_status:parsed?'observed_url_variant_canonical_not_verified':'unparsed_url'};
});
const dayRows = byDays.slice(1).map(row => ({date:row[0].replace(/\s+/g,' ').trim(), ...metrics(row)}));
const deviceRows = byDevices.slice(1).map(row => ({device:row[0].trim(), ...metrics(row)}));
writeCsv('queries.csv',queryRows,['query','normalized_query','clicks','impressions','ctr_percent','position','intent','canonical_url','mapping_status','mapping_confidence','prior_snapshot_exact_form','new_in_current_snapshot']);
writeCsv('pages.csv',pageRows,['raw_page_url','clicks','impressions','ctr_percent','position','observed_scheme','observed_host','observed_path','observed_query_string','path_without_query','has_query_variant','historical_http_url','mapping_status']);
writeCsv('days.csv',dayRows,['date','clicks','impressions','ctr_percent','position']);
writeCsv('devices.csv',deviceRows,['device','clicks','impressions','ctr_percent','position']);

const sum = (rows,key) => rows.reduce((a,r)=>a+r[key],0);
const totalClicks=sum(dayRows,'clicks'), totalImpressions=sum(dayRows,'impressions');
const matchedClicks=sum(queryRows,'clicks'), matchedImpressions=sum(queryRows,'impressions');
const week=(from,to)=>dayRows.filter((_,i)=>i>=from&&i<=to);
const w0=week(7,13), w1=week(0,6); // daily rows arrive newest first
const totals = rows => {const clicks=sum(rows,'clicks'),impressions=sum(rows,'impressions');return {clicks,impressions,ctr_percent:impressions?100*clicks/impressions:0};};
const intentCounts={}; for(const row of queryRows){const key=row.intent;intentCounts[key]??={queries:0,clicks:0,impressions:0};intentCounts[key].queries++;intentCounts[key].clicks+=row.clicks;intentCounts[key].impressions+=row.impressions;}
const mapCounts={}; for(const row of queryRows) mapCounts[row.mapping_status]=(mapCounts[row.mapping_status]||0)+1;
const newRows=queryRows.filter(row=>row.new_in_current_snapshot==='yes');
const summary={
  source:{property:'sc-domain:malinaklubnika.ru',search_type:'Web',filters:'all countries and devices; no query/page filters',period:'2026-09-27 through 2026-10-10',captured_at:'2026-10-12',private_snapshot_not_in_repository:true},
  totals:{clicks:totalClicks,impressions:totalImpressions,ctr_percent:100*totalClicks/totalImpressions,average_position:12.4,disclosed_query_clicks:matchedClicks,disclosed_query_impressions:matchedImpressions,undisclosed_difference_clicks:totalClicks-matchedClicks,undisclosed_difference_impressions:totalImpressions-matchedImpressions,query_rows:queryRows.length,page_rows:pageRows.length,daily_rows:dayRows.length,device_rows:deviceRows.length,page_dimension_sum:{clicks:sum(pageRows,'clicks'),impressions:sum(pageRows,'impressions')},page_dimension_note:'The sum of URL-row impressions can exceed the property total because page rows are a separate URL aggregation with variants; it is not an additive property share or hidden-query difference.'},
  equal_week_comparison:{'2026-09-27_to_2026-10-03':totals(w0),'2026-10-04_to_2026-10-10':totals(w1),impression_change_percent:(totals(w1).impressions/totals(w0).impressions-1)*100,clicks_multiple:totals(w1).clicks/totals(w0).clicks},
  query_mapping_status_counts:mapCounts,intents:intentCounts,
  old_snapshot:{path:'research/analytics/search-intents-2026-10-08/query-intents.csv',period:'2026-09-27 through 2026-10-06',rows:oldRows.length,comparison:'normalized exact form; current GSC rows new to this export are not proof of new market demand'},
  new_current_forms:{count:newRows.length,clicks:sum(newRows,'clicks'),impressions:sum(newRows,'impressions'),examples:newRows.sort((a,b)=>b.impressions-a.impressions).slice(0,20).map(({query,clicks,impressions,position,intent,mapping_status})=>({query,clicks,impressions,position,intent,mapping_status}))},
  interpretation_limits:['GSC impressions are reported search-result appearances for this property, not Wordstat query volume or market demand.','Growth compares equal seven-day windows and does not establish an effect from the 2026-10-08 release.','Queries omitted by Google are an aggregate difference; their intent cannot be assigned.','Observed HTTP and query-string page URLs are historical report rows; this dataset does not test current redirects or canonicals.','Prior Admitad audit for 2026-09-01 through 2026-10-12 recorded 0 orders and 0 commission across all three sellers; GSC impressions and clicks do not establish income.']
};
fs.writeFileSync(path.join(here,'summary.json'),JSON.stringify(summary,null,2)+'\n');

const topQueries=[...queryRows].sort((a,b)=>b.impressions-a.impressions).slice(0,18);
const newSamples=summary.new_current_forms.examples.slice(0,12);
const priorities=pageRows.map(r=>({path:r.path_without_query,impressions:r.impressions,clicks:r.clicks,position:r.position})).filter(r=>r.path.startsWith('/sorta/')).reduce((m,r)=>{const x=m[r.path]??={path:r.path,impressions:0,clicks:0,best_position:Infinity};x.impressions+=r.impressions;x.clicks+=r.clicks;x.best_position=Math.min(x.best_position,r.position);m[r.path]=x;return m;},{});
const selectedSlugs=['krasa-rossii','atlant','albion','rumba','magnus','poklon-kazakovu','pohvalinka','lyachka'];
const topPages=selectedSlugs.map(slug=>priorities[`/sorta/${slug}/`]||{path:`/sorta/${slug}/`,impressions:0,clicks:0,best_position:null});
const nextPage=priorities['/sorta/salyut/'];
const md=`# Google Search Console → контент MALINA, 12 октября 2026\n\n## Источник и границы\n\nСнимок свойства \`sc-domain:malinaklubnika.ru\`, тип поиска Web, все страны и устройства, период 27 сентября — 10 октября 2026. Сырые снимки кабинета и учётные данные не входят в репозиторий. Скрипт \`build-report.mjs\` пересобирает таблицы из локального снимка и старого экспортированного CSV.\n\nGSC показывает 10 кликов, 720 показов, CTR 1,4% и среднюю позицию 12,4. В раскрытой таблице 123 запроса дают 4 клика и 369 показов; разница 6 кликов и 351 показ остаётся без раскрытых запросов. Интент этой части установить нельзя. Страницы отражают URL-строки отчёта: их сумма по 98 строкам — 10 кликов и 812 показов. Это независимый URL-разрез, не доля от 720 показов и не способ вычислить скрытые запросы. В строках есть исторические HTTP и query-варианты; их сохранение не означает, что текущая HTTP-страница отвечает ошибкой или что проверена текущая canonical/redirect.\n\n## Сравнение равных окон\n\n| Окно | Клики | Показы | CTR |\n| --- | ---: | ---: | ---: |\n| 27.09–03.10 | ${totals(w0).clicks} | ${totals(w0).impressions} | ${totals(w0).ctr_percent.toFixed(2)}% |\n| 04.10–10.10 | ${totals(w1).clicks} | ${totals(w1).impressions} | ${totals(w1).ctr_percent.toFixed(2)}% |\n\nПоказы во втором окне выросли на ${summary.equal_week_comparison.impression_change_percent.toFixed(1)}%; кликов стало в 4 раза больше. Это изменение между окнами, а не доказательство эффекта релиза 8 октября: наблюдений мало, сайт новый, сезонность и задержка отчётности не отделены.\n\n## Интенты и работа с контентом\n\nНаиболее сильный измеренный сигнал — выбор конкретного сорта по описанию. Восемь карточек целевого редакционного спринта. Суммы ниже сложены по URL-строкам, сгруппированным по пути; из-за вариантов URL это рабочая навигация к карточке, а не доля от итога свойства:\n\n| Карточка | Показы URL | Клики | Лучшая средняя позиция в строках URL |\n| --- | ---: | ---: | ---: |\n${topPages.map(x=>`| \`${x.path}\` | ${x.impressions} | ${x.clicks} | ${x.best_position===null?'—':x.best_position.toFixed(1)} |`).join('\n')}
| Следом: \`/sorta/salyut/\` | ${nextPage?.impressions??0} | ${nextPage?.clicks??0} | ${nextPage?.best_position?.toFixed(1)??'—'} |\n\nПрактический порядок редакции: сначала улучшить первые ответы, title/description и переходы к сравнению/подходящему товару на карточках Краса России, Атлант, Альбион, Румба, Магнус, Поклон Казакову, Похвалинка и Лячка; сверять смысл каждой формы с карточкой, не добавлять неподтверждённых отзывов/урожайности. Салют — следующий приоритет по кликовому сигналу (две URL-строки, 10 показов, 2 клика). Затем улучшить входы в существующие руководства про осеннюю пересадку клубники, усы и пожелтение листьев малины; не создавать новый URL для каждой формулировки. Региональные запросы на низких позициях требуют усиления уже существующих ответов и внутренних ссылок.\n\nНиже примеры запросов с наибольшими показами в текущем снимке. «Новая форма» означает только отсутствие нормализованной точной строки в прежнем файле от 8 октября.\n\n| Запрос | Клики | Показы | Позиция | Интент / сопоставление |\n| --- | ---: | ---: | ---: | --- |\n${topQueries.slice(0,12).map(q=>`| ${q.query.replaceAll('|','\\|')} | ${q.clicks} | ${q.impressions} | ${q.position.toFixed(1)} | ${q.intent} · ${q.mapping_status} |`).join('\n')}\n\nВсего ${newRows.length} из 123 текущих форм не встречались в старом CSV (82 строки, период 27.09–06.10). Примеры: ${newSamples.map(x=>`«${x.query}» (${x.impressions} показов)`).join(', ')}. Это «вновь замечено в новом снимке», а не доказательство нового пользовательского спроса; сравниваются экспорты с разными датами и объёмом раскрытия.\n\n### Качество URL-сопоставления\n\nВсе запросы сохранены в \`queries.csv\`; для каждой строки есть статус и URL либо явно пустое каноническое назначение. Сортовые алиасы сопоставляются через \`site/seo-query-intents.mjs\` и актуальный каталог. Распределение: 83 сортовых сопоставления, 5 сопоставлений с конкретной темой, 30 тематических кандидатов на ручную проверку и 5 строк без подтверждённого URL. Кандидатный URL не считается подтверждённым ответом; пятёрка без URL включает общий/неясный интент, форму про другое растение и запросы с чужим брендом «Малинник.ру». Статусы строк: \`mapped_cultivar_alias\`, \`mapped_topic_by_question\`, \`topic_candidate_review\` и \`unconfirmed_no_canonical\`. Перед выпуском контентных изменений вручную проверьте тематические кандидаты и 5 строк без URL.\n\n## Следующая цель к 9 ноября\n\nДля одной закрытой семидневной недели к 9 ноября: не менее 1 000 показов, 20 кликов и CTR 2% по свойству; улучшить содержание приоритетных карточек. 10 органических переходов к товарам и 1 подтверждённый заказ — целевая гипотеза цикла, не факт и не прогноз. В предыдущем аудите Admitad за 01.09–12.10 у всех трёх продавцов было 0 заказов и 0 комиссии; достижение цели измеряется только фактическими данными аналитики и кабинета партнёра.\n\n## Файлы и воспроизведение\n\n- \`queries.csv\`: 123 раскрытые строки, метрики, интенты, URL-назначения/статусы и точное сравнение с прежним экспортом.\n- \`pages.csv\`: 98 URL-строк; схема, путь и query сохранены раздельно.\n- \`days.csv\`: дневные строки.\n- \`devices.csv\`: три устройства.\n- \`summary.json\`: totals, равные недели, суммы интентов, охват маппинга и примеры новых форм.\n\n\`node research/analytics/gsc-content-2026-10-12/build-report.mjs <private-dimensions-all.json> research/analytics/search-intents-2026-10-08/query-intents.csv\`\n`;
fs.writeFileSync(path.join(here,'README.md'),md);
console.log(JSON.stringify({queries:queryRows.length,pages:pageRows.length,days:dayRows.length,devices:deviceRows.length,totals:{clicks:totalClicks,impressions:totalImpressions},queryTotals:{clicks:matchedClicks,impressions:matchedImpressions},mapping:mapCounts,newForms:newRows.length},null,2));
