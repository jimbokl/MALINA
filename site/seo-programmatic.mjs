import { researchedCultivars } from './seo-cultivar-research.mjs';
import { researchedStrawberryTail } from './seo-cultivar-strawberry-tail.mjs';
import { cultivarPhotoHtml, externalReviewsHtml } from './seo-cultivar-resources.mjs';
import { getComparisonMeasurements } from './assets/comparison-model.mjs';
import { getRegionalTrials } from './assets/regional-trials.mjs';
import { cultivarEntryNavigation } from './search-entry.mjs';

export const seoReviewedIso = '2026-10-08';
export const normalizeQuery = value => String(value).toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/[—–-]/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const cropName = crop => crop === 'raspberry' ? 'малины' : 'клубники';
const cropRoute = crop => crop === 'raspberry' ? 'malina' : 'klubnika';
export const cropCatalogPath = crop => `/sorta/${cropRoute(crop)}/`;
export const regionalCatalogPath = crop => `${cropCatalogPath(crop)}regiony/`;
export const cultivarPath = item => `/sorta/${item.slug}/`;
const paragraph = text => `<p>${e(text)}</p>`;
const link = (path, text) => `<a href="${e(path)}">${e(text)}</a>`;
const sources = entries => `<section class="source-panel" id="seo-sources"><h2>Источники</h2><ul>${entries.filter(item => item?.url).map(item => `<li>${link(item.url, item.label)}</li>`).join('')}</ul><p>Описание и источники проверены 08.10.2026. Измерения относятся к условиям указанных опытов.</p></section>`;
const list = items => `<ul>${items.map(item => `<li>${link(cultivarPath(item), item.name)}</li>`).join('')}</ul>`;
const section = (id, title, content) => `<section id="${id}"><h2>${e(title)}</h2>${content}</section>`;

export function programmaticCultivars(base) {
  const bySlug = new Map(base.map(item => [item.slug, item]));
  const names = new Set(base.map(item => `${item.cropKey}:${normalizeQuery(item.name)}`));
  const added = [];
  for (const item of [...researchedCultivars, ...researchedStrawberryTail]) {
    if (!['verified', 'trade_description'].includes(item.status)) continue;
    if (!item.sourceUrl || !item.paragraphs?.length || !item.facts?.length) throw new Error(`Incomplete researched cultivar: ${item.slug}`);
    if (bySlug.has(item.slug) || names.has(`${item.cropKey}:${normalizeQuery(item.name)}`)) continue;
    added.push(item);
    bySlug.set(item.slug, item);
    names.add(`${item.cropKey}:${normalizeQuery(item.name)}`);
  }
  return added;
}

function researchedBody(item) {
  const title = `${item.cropKey === 'raspberry' ? 'Малина' : 'Клубника'} ${item.name}: ${item.status === 'trade_description' ? 'описание и проверка названия' : 'описание сорта'}`;
  const photo = cultivarPhotoHtml(item);
  const reviews = externalReviewsHtml(item) || paragraph('Пока не подобрали опубликованные отзывы садоводов об этом названии.');
  return { title, description: item.paragraphs[0], body: `<section class="simple-hero"><div class="wrap"><div class="breadcrumbs">${link('/', 'Главная')} / ${link(cropCatalogPath(item.cropKey), `Сорта ${cropName(item.cropKey)}`)}</div><span class="eyebrow">СОРТОВАЯ СПРАВКА</span><h1>${e(title)}</h1><p>${e(item.paragraphs[0])}</p>${cultivarEntryNavigation(item)}</div></section><div class="section wrap article-body">${section('seo-opisanie', `Характеристики ${item.name}`, item.paragraphs.slice(1).map(paragraph).join('') + `<dl class="catalog-facts">${item.facts.map(fact => `<div><dt>${e(fact.label)}</dt><dd>${e(fact.value)}</dd></div>`).join('')}</dl>`)}${section('seo-photo', `Фото ${item.name}`, photo)}${section('seo-reviews', `Отзывы о сорте ${item.name}`, reviews + link('/otzyvy/', 'Как устроены отзывы садоводов'))}${section('seo-care', `Посадка и уход`, paragraph(item.cropKey === 'raspberry' ? 'Посадите малину на дренированном месте и поддерживайте влагу в корневой зоне. Предусмотрите опору и контролируйте густоту ряда. Перед обрезкой уточните тип плодоношения: летний урожай образуется на сохранённых побегах прошлого года, осенний урожай ремонтантных сортов — на побегах текущего года.' : 'При посадке расправьте корни и оставьте сердечко у поверхности почвы. Поливайте корневую зону, не засыпая сердечко грунтом или мульчей. Для размножения выбирайте усы здоровых маточных растений. Частота подкормок и ожидание повторного урожая зависят от типа плодоношения.') + link(`/zhurnal/${item.cropKey === 'raspberry' ? 'posadka-maliny' : 'posadka-klubniki'}/`, `Посадка ${cropName(item.cropKey)}`) + ' · ' + link(`/zhurnal/${item.cropKey === 'raspberry' ? 'letnyaya-ili-remontantnaya-malina' : 'remontantnaya-klubnika'}/`, 'Тип плодоношения'))}${item.limitations ? paragraph(item.limitations) : ''}${sources([{ url: item.sourceUrl, label: item.sourceLabel }])}</div>` };
}

function regionalBody(crop, base, catalog) {
  const records = catalog.cultivars.filter(item => item.crop_slug === crop && item.admissions?.length);
  const bySlug = new Map(base.map(item => [item.slug, item]));
  const regionGroups = new Map();
  for (const region of catalog.regions) {
    const number = region.admission_region_number;
    if (!number) continue;
    if (!regionGroups.has(number)) regionGroups.set(number, { name: region.admission_region_name, regions: [] });
    regionGroups.get(number).regions.push(region);
  }
  const contents = [...regionGroups].sort((a, b) => a[0] - b[0]).map(([number, group]) => {
    const admitted = records.filter(item => item.admissions.some(admission => admission.admission_region_number === number));
    const trials = group.regions.flatMap(region => getRegionalTrials(catalog, region.code, crop));
    const uniqueTrials = new Map();
    for (const trial of trials) for (const finding of trial.findings) uniqueTrials.set(`${trial.slug}:${finding.traitCode}:${finding.sourceUrl}:${finding.value}:${finding.period}`, { trial, finding });
    const trialHtml = [...uniqueTrials.values()].map(({ trial, finding }) => `<li>${link(cultivarPath(trial), trial.name)}: ${e(finding.label)} — ${e(finding.value)}. ${e(finding.placeLabel || finding.place)}; ${e(finding.period)}. ${e(finding.conditions || '')} ${link(finding.sourceUrl, finding.sourceTitle)}</li>`).join('');
    return section(`region-${number}`, `${number}. ${group.name}`, paragraph(`К этому региону допуска относятся: ${group.regions.map(region => region.name_ru).join(', ')}.`) + paragraph('В списке ниже — сорта из нашего каталога с подтверждённым допуском в издании Госреестра от 31.05.2024. Допуск не ранжирует сорта по вкусу, урожаю или пригодности для конкретного участка.') + list(admitted.map(item => bySlug.get(item.slug) || { slug: item.slug, name: item.canonical_name })) + (trialHtml ? `<h3>Измерения в региональных опытах</h3><ul>${trialHtml}</ul>` : paragraph('Для сортов этой подборки в нашей базе пока нет сопоставимых региональных измерений урожайности. Сроки и тип плодоношения проверяйте в описании каждого сорта.')));
  }).join('');
  return `<section class="simple-hero"><div class="wrap"><div class="breadcrumbs">${link('/', 'Главная')} / ${link(cropCatalogPath(crop), `Сорта ${cropName(crop)}`)}</div><span class="eyebrow">РЕГИОН И УСЛОВИЯ</span><h1>Сорта ${cropName(crop)} по регионам России</h1><p>Регион допуска и результаты местных опытов помогают сузить выбор. Здесь можно проверить Подмосковье, Урал, Сибирь и другие регионы без обещания универсального «лучшего сорта».</p></div></section><div class="section wrap article-body"><nav class="article-toc" aria-label="Регионы допуска"><ul>${[...regionGroups].sort((a, b) => a[0] - b[0]).map(([number, group]) => `<li>${link(`#region-${number}`, group.name)}</li>`).join('')}</ul></nav>${contents}${sources([{ url: records[0]?.admissions[0]?.source_url, label: records[0]?.admissions[0]?.source_title }])}</div>`;
}

function cropDirectoryBody(crop, base, added, catalog) {
  const cropBase = base.filter(item => item.cropKey === crop);
  const cropAdded = added.filter(item => item.cropKey === crop).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  const catalogBySlug = new Map(catalog.cultivars.map(item => [item.slug, item]));
  const observations = trait => cropBase.flatMap(item => getComparisonMeasurements(catalogBySlug.get(item.slug), trait).map(measure => ({ item, measure })));
  const measuredList = trait => `<ul>${observations(trait).map(({ item, measure }) => `<li>${link(cultivarPath(item), item.name)} — ${e(measure.value)}. ${e(measure.context)}. ${link(measure.sourceUrl, measure.sourceTitle)}</li>`).join('')}</ul>`;
  const sourceFacts = pattern => {
    const profiles = [...researchedCultivars, ...researchedStrawberryTail].filter(item => item.cropKey === crop && ['verified', 'trade_description'].includes(item.status));
    const seen = new Set();
    const lines = profiles.flatMap(item => item.facts.filter(fact => pattern.test(`${fact.label} ${fact.value}`)).map(fact => {
      const key = `${item.name}:${fact.value}`;
      if (seen.has(key)) return '';
      seen.add(key);
      const target = [...cropBase, ...cropAdded].find(value => value.slug === item.slug || normalizeQuery(value.name) === normalizeQuery(item.name));
      return target ? `<li>${link(cultivarPath(target), item.name)} — ${e(fact.label)}: ${e(fact.value)} ${link(item.sourceUrl, item.sourceLabel)}</li>` : '';
    })).filter(Boolean);
    return lines.length ? '<h3>Сведения из сортовых описаний</h3><ul>' + lines.join('') + '</ul>' : '';
  };
  const bySeason = key => list(cropBase.filter(item => item.harvestTiming === key));
  const typeGroups = crop === 'raspberry'
    ? '<h3>Летняя малина</h3>' + list(cropBase.filter(item => item.fruiting === 'summer')) + '<h3>Ремонтантная малина</h3>' + list(cropBase.filter(item => item.fruiting === 'remontant'))
    : '<h3>Ремонтантная клубника и нейтральный день</h3>' + list(cropBase.filter(item => item.fruiting === 'remontant' || /нейтральн/i.test(item.fruitingLabel || ''))) + '<h3>Однократное сезонное плодоношение</h3>' + list(cropBase.filter(item => item.fruiting === 'summer'));
  const typeSection = section('tipy', 'Тип плодоношения: ремонтантные и сезонные сорта', paragraph(crop === 'raspberry' ? 'Летнюю малину ведут с сохранением побегов для следующего сезона. У ремонтантной возможна культура на побегах текущего года; выбор схемы зависит от длины тёплого периода. Открывайте описание сорта и рекомендации по обрезке.' : 'Ремонтантность описывает повторное плодоношение, а НСД и КСД — реакцию на длину дня. Здесь перечислены сорта, для которых тип указан в исходном каталоге. Сорта без подтверждённого типа в эти группы не включены.') + typeGroups + sourceFacts(/ремонтант|плодоношен|нейтральн.*дн|коротк.*дн|primocane|floricane/i) + link('/zhurnal/' + (crop === 'raspberry' ? 'letnyaya-ili-remontantnaya-malina' : 'remontantnaya-klubnika') + '/', 'Сравнить типы плодоношения и уход'));

  return `<section class="simple-hero"><div class="wrap"><div class="breadcrumbs">${link('/', 'Главная')} / ${link('/sorta/', 'Каталог сортов')}</div><span class="eyebrow">СРАВНИТЬ И ВЫБРАТЬ</span><h1>Сорта ${cropName(crop)}: описания, сроки и условия</h1><p>Сравните тип плодоношения, время сбора и сведения из опытов. У каждого сорта есть отдельное описание и источник.</p></div></section><div class="section wrap article-body"><nav class="article-toc" aria-label="Выбор сорта"><ul>${[['catalog', 'Все сорта'], ['tipy', 'Тип плодоношения'], ['sroki', 'Ранние и поздние'], ['urozhay', 'Урожайность'], ['razmer', 'Размер ягоды'], ['vkus', 'Вкус и сладость'], ['ustoychivost', 'Зимостойкость и болезни']].map(([id, title]) => `<li>${link(`#${id}`, title)}</li>`).join('')}<li>${link(regionalCatalogPath(crop), 'Сорта по регионам')}</li></ul></nav>${section('catalog', `Каталог сортов ${cropName(crop)}`, list([...cropBase, ...cropAdded].sort((a, b) => a.name.localeCompare(b.name, 'ru'))))}${typeSection}${section('sroki', 'Ранние и поздние сорта', paragraph('Срок созревания описывает положение сорта в сезоне испытания. Конкретный день сбора меняется по региону и погоде. Ремонтантность характеризует плодоношение, а не заменяет указание срока.') + '<h3>Ранний срок</h3>' + bySeason('early') + '<h3>Средний срок</h3>' + bySeason('middle') + '<h3>Поздний срок</h3>' + bySeason('late') + sourceFacts(/срок|созреван|ранн|поздн/i))}${section('urozhay', 'Урожайные сорта: сравниваем измерения', paragraph('Для сравнения урожайности нужны одинаковые единицы и условия: кг с куста, т/га и биологическая урожайность — разные показатели. Здесь сохранены место, годы и условия каждого опыта; значения нельзя складывать в рейтинг урожайности.') + measuredList('yield') + sourceFacts(/урожайност|продуктивност/i) + link(`/sravnenie/${cropRoute(crop)}/`, 'Сравнить сорта и контекст измерений'))}${section('razmer', 'Крупная ягода: средняя масса и максимум', paragraph('Среднюю массу нельзя заменять рекордной ягодой. Размер зависит от года, нагрузки куста и условий выращивания. Ниже — опубликованные измерения массы, для которых сохранён контекст опыта.') + measuredList('berry_weight_g') + sourceFacts(/масса|вес.*ягод|ягод.*вес/i))}${section('vkus', 'Сладкие и вкусные сорта', paragraph('Описание «сладкий» не даёт общего рейтинга сортов: вкус меняется со зрелостью, погодой, поливом и нагрузкой растения. Дегустационная оценка и содержание растворимых веществ — разные показатели. Сравнивайте их только в пределах одной методики и одного опыта.') + paragraph('Откройте описание нужного сорта: если источник публикует вкус, кислотность или показатель Brix, они приведены вместе с происхождением данных. Для участка полезнее сопоставить местный опыт, сроки и условия выращивания.') + sourceFacts(/вкус|слад|кислот|brix/i) + (crop === 'raspberry' ? link('/zhurnal/pochemu-malina-kislaya-vkus-i-zrelost/', 'Зрелость, сахара и кислотность малины') : '') + link('/rating/', 'Рекомендации читателей с числом голосов'))}${section('ustoychivost', 'Зимостойкость и устойчивость к болезням', paragraph('Зимостойкость включает несколько реакций на холод и оттепели. Результат промораживания побегов или наблюдения после одной зимы не подтверждает устойчивость ко всем болезням и для всей России. Проверяйте организм или режим, который оценивали, место и годы опыта.') + sourceFacts(/зимостой|морозостой|устойчив.*(?:болезн|гнил|росе|хлороз|ржавчин)/i) + link(regionalCatalogPath(crop), 'Проверить регион допуска и местные измерения') + ' · ' + link(`/zhurnal/${crop === 'raspberry' ? 'bolezni-i-vrediteli-maliny-priznaki' : 'bolezni-klubniki-priznaki-i-proverka'}/`, 'Различить признаки болезней'))}</div>`;
}

export function addProgrammaticPages({ pages, paths, layout, varieties, catalog }) {
  const added = programmaticCultivars(varieties);
  const put = (path, options) => {
    if (pages.has(path)) throw new Error(`Programmatic route collides: ${path}`);
    pages.set(path, layout({ ...options, path, active: 'catalog' }));
    if (!paths.includes(path)) paths.push(path);
  };
  for (const item of added) put(cultivarPath(item), researchedBody(item));
  for (const crop of ['raspberry', 'strawberry']) {
    put(cropCatalogPath(crop), { title: `Сорта ${cropName(crop)}: описания и выбор`, description: `Каталог сортов ${cropName(crop)}: сроки, плодоношение, размер ягоды, урожайность и региональные данные с источниками.`, body: cropDirectoryBody(crop, varieties, added, catalog) });
    put(regionalCatalogPath(crop), { title: `Сорта ${cropName(crop)} по регионам России`, description: `Проверенные допуски сортов ${cropName(crop)} для регионов России и измерения в местных опытах.`, body: regionalBody(crop, varieties, catalog) });
  }
  const catalogLinks = `<section class="section wrap" id="seo-catalogs"><h2>Каталоги по культурам и регионам</h2><ul>${['raspberry', 'strawberry'].map(crop => `<li>${link(cropCatalogPath(crop), `Все сорта ${cropName(crop)}`)} · ${link(regionalCatalogPath(crop), 'Регионы допуска и опыты')}</li>`).join('')}</ul></section>`;
  pages.set('/sorta/', pages.get('/sorta/').replace('</main>', `${catalogLinks}</main>`));
  for (const item of varieties) {
    const path = cultivarPath(item);
    const record = catalog.cultivars.find(value => value.slug === item.slug);
    const extra = [...researchedCultivars, ...researchedStrawberryTail].find(value => ['verified', 'trade_description'].includes(value.status) && (value.slug === item.slug || (value.cropKey === item.cropKey && normalizeQuery(value.name) === normalizeQuery(item.name))));
    const measurements = ['yield', 'berry_weight_g'].flatMap(trait => getComparisonMeasurements(record, trait).map(measure => `<li>${trait === 'yield' ? 'Урожайность' : 'Масса ягоды'}: ${e(measure.value)}. ${e(measure.context)}. ${link(measure.sourceUrl, measure.sourceTitle)}</li>`)).join('');
    const externalReviews = externalReviewsHtml(item);
    const content = `<div class="section wrap article-body">${section('seo-opisanie', `Описание сорта ${item.name}: что сравнить`, paragraph(item.note) + `<dl class="catalog-facts"><div><dt>Плодоношение</dt><dd>${e(item.fruitingLabel)}</dd></div><div><dt>Срок созревания</dt><dd>${e(item.period)}</dd></div><div><dt>Место выращивания</dt><dd>${e(item.place)}</dd></div></dl>` + (extra ? extra.paragraphs.map(paragraph).join('') + `<dl class="catalog-facts">${extra.facts.map(fact => `<div><dt>${e(fact.label)}</dt><dd>${e(fact.value)}</dd></div>`).join('')}</dl>` : '') + (measurements ? `<h3>Измерения в опытах</h3><ul>${measurements}</ul>` : ''))}${section('seo-care', `Посадка и уход за ${item.name}`, paragraph(item.cropKey === 'raspberry' ? (item.fruiting === 'remontant' ? 'При выращивании на один осенний урожай ремонтантной малины отплодоносившие побеги удаляют целиком в период покоя. Если оставляют побеги для летнего урожая, сохраняют их живую часть; две схемы не смешивают. Посадите растение на дренированном месте, контролируйте влажность корневой зоны и густоту ряда.' : 'У летней малины после сбора удаляют отплодоносившие двухлетние побеги и сохраняют здоровые побеги текущего года. Посадите растение на дренированном месте, предусмотрите опору и поддерживайте влагу в корневой зоне. Если тип плодоношения неизвестен, сначала проследите, на каких побегах появляются цветки.') : 'При посадке расправьте корни, оставив сердечко у поверхности почвы. Следите за влагой в корневой зоне и состоянием сердечка. Усы используют для размножения только от здоровых маточных растений; схема ухода и ожидание повторного урожая зависят от типа плодоношения.') + link(`/zhurnal/${item.cropKey === 'raspberry' ? 'posadka-maliny' : 'posadka-klubniki'}/`, 'Подробно о посадке') + ' · ' + link(`/zhurnal/${item.cropKey === 'raspberry' ? 'uhod-za-malinoi-v-techenie-sezona' : 'uhod-za-klubnikoi-v-techenie-sezona'}/`, 'Уход в течение сезона'))}${section('seo-photo', `Фото сорта ${item.name}`, cultivarPhotoHtml(item, extra))}<p>${link(cropCatalogPath(item.cropKey), `Сравнить с другими сортами ${cropName(item.cropKey)}`)} · ${link(regionalCatalogPath(item.cropKey), 'Проверить регион допуска')}</p>${extra ? sources([{ url: extra.sourceUrl, label: extra.sourceLabel }]) : ''}</div>`;
    let html = pages.get(path).replace('</main>', `${content}</main>`);
    if (externalReviews) html = html.replace('<p id="reviews-filter"', `${externalReviews}<p id="reviews-filter"`);
    pages.set(path, html);
  }
  return { addedCultivars: added.length, addedPages: added.length + 4 };
}
