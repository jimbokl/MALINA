import test from 'node:test';
import assert from 'node:assert/strict';
import { admissionForPlace, comparisonHref, comparisonPickerHref, cultivarHref, getComparisonFacts, getComparisonLabels, getComparisonMeasurements, getComparisonYield, getComparisonYields, hasComparisonDifference, parseSelection, resolveComparisonPlace, searchComparisonVarieties, toggleSelection } from '../assets/comparison-model.mjs';
import { varieties } from '../data.mjs';

test('общая ссылка сохраняет город и регион вместе с выбором сортов', () => {
  assert.equal(
    comparisonHref('raspberry', ['polka', 'joan-j'], '?city=Калининград&region=Калининградская+область', '/MALINA'),
    '/MALINA/sravnenie/malina/?city=%D0%9A%D0%B0%D0%BB%D0%B8%D0%BD%D0%B8%D0%BD%D0%B3%D1%80%D0%B0%D0%B4&region=%D0%9A%D0%B0%D0%BB%D0%B8%D0%BD%D0%B8%D0%BD%D0%B3%D1%80%D0%B0%D0%B4%D1%81%D0%BA%D0%B0%D1%8F+%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C&sort=polka%2Cjoan-j'
  );
});

test('после очистки сортов общая ссылка явно сохраняет пустой выбор', () => {
  const href = comparisonHref('raspberry', [], '?city=Москва&region=Московская+область&sort=polka,joan-j');
  const url = new URL(href, 'https://example.test');
  assert.equal(url.searchParams.has('sort'), true);
  assert.equal(url.searchParams.get('sort'), '');
  assert.deepEqual(parseSelection(url.searchParams.get('sort'), varieties, 'raspberry'), []);
  assert.equal(url.searchParams.get('city'), 'Москва');
});

test('из сравнения город и регион доходят до отзывов карточки сорта', () => {
  const path = cultivarHref('polka', { city: 'Тула', region: 'Тульская область', siteBase: '/MALINA' });
  const url = new URL(path, 'https://example.test');
  assert.equal(url.pathname, '/MALINA/sorta/polka/');
  assert.equal(url.searchParams.get('city'), 'Тула');
  assert.equal(url.searchParams.get('region'), 'Тульская область');
  assert.equal(cultivarHref('polka'), '/sorta/polka/');
});

test('общий выбор принимает известные сорта одной культуры, без дублей и больше четырёх', () => {
  assert.deepEqual(parseSelection('polka,joan-j,polka,elan,cambridge-favourite,unknown', varieties, 'raspberry'), ['polka', 'joan-j']);
});

test('добавление ограничено культурой и максимумом четырёх сортов', () => {
  const four = ['polka', 'joan-j'];
  assert.deepEqual(toggleSelection(four, 'elan', varieties, 'raspberry'), { selection: four, reason: 'wrong-crop' });
  const strawberry = ['cambridge-favourite', 'elan'];
  assert.deepEqual(toggleSelection(strawberry, 'polka', varieties, 'strawberry'), { selection: strawberry, reason: 'wrong-crop' });
  assert.deepEqual(toggleSelection(['a', 'b', 'c', 'd'], 'polka', varieties, 'raspberry'), { selection: ['a', 'b', 'c', 'd'], reason: 'limit' });
});

test('выбор можно отменить, а неизвестные характеристики имеют явное пустое значение', () => {
  assert.deepEqual(toggleSelection(['polka', 'joan-j'], 'polka', varieties, 'raspberry'), { selection: ['joan-j'], reason: null });
  const facts = getComparisonFacts(varieties.find(item => item.slug === 'polka'));
  assert.equal(facts.length, 5);
  assert.equal(facts.at(-1)[1], varieties.find(item => item.slug === 'polka').note);
  const incomplete = getComparisonFacts({ ...varieties[0], period: null });
  assert.equal(incomplete[2][1], null);
});

test('подписи характеристик в таблице сравнения остаются полными на узком экране', () => {
  assert.deepEqual(getComparisonLabels(), [
    'Культура', 'Тип плодоношения', 'Когда созревает', 'Где выращивать', 'Коротко о сорте', 'Урожайность', 'Масса ягоды'
  ]);
  assert.deepEqual(getComparisonLabels(true), [
    'Культура', 'Тип плодоношения', 'Когда созревает', 'Где выращивать', 'Коротко о сорте', 'Урожайность', 'Масса ягоды', 'Есть ли сорт в официальном списке'
  ]);
});

test('сравнение показывает урожайность только по проверенному паспорту опыта и сохраняет его условия', () => {
  const observation = {
    trait_code: 'yield', value_number: 21.6, value_max: null, unit: 'т/га',
    source_url: 'https://example.test/study', source_title: 'Сортоиспытание',
    evidence: { period_from: '2006', period_to: '2007', place_text: 'Кокино, Брянская область', setting_text: 'Полевой опыт', source_locator: 'Таблица 2, строка сорта' }
  };
  assert.deepEqual(getComparisonYield({ observations: [observation] }), {
    value: '21,6 т/га', context: 'Кокино, Брянская область · 2006–2007 · Полевой опыт',
    sourceUrl: 'https://example.test/study', sourceTitle: 'Сортоиспытание', sourceLocator: 'Таблица 2, строка сорта'
  });
  assert.equal(getComparisonYield({ observations: [{ ...observation, evidence: null }] }), null);
  assert.equal(getComparisonYield({ yieldObservation: { ...observation, evidence: null } }), null);
  assert.equal(getComparisonYield({ observations: [{ ...observation, source_url: 'javascript:alert(1)' }] }), null);
  for (const field of ['place_text', 'setting_text', 'source_locator']) {
    assert.equal(getComparisonYield({ observations: [{ ...observation, evidence: { ...observation.evidence, [field]: null } }] }), null, field);
  }
  assert.equal(getComparisonYield({ observations: [{ ...observation, evidence: { ...observation.evidence, period_from: null, period_to: null } }] }), null);
  assert.equal(getComparisonYield({ observations: [{ ...observation, evidence: { ...observation.evidence, period_from: ' ', period_to: null } }] }), null);
  assert.equal(getComparisonYield({ observations: [{ ...observation, source_title: '' }] }), null);
  assert.deepEqual(getComparisonYield({ observations: [
    { ...observation, evidence: { ...observation.evidence, place_text: null } }, observation
  ] }).value, '21,6 т/га');
  const second = { ...observation, value_number: 148.3, unit: 'ц/га',
    source_url: 'https://example.test/second-study',
    evidence: { ...observation.evidence, place_text: 'Московская область' } };
  assert.deepEqual(getComparisonYields({ yieldObservations: [observation, second] }).map(item => item.value), ['21,6 т/га', '148,3 ц/га']);
  assert.equal(getComparisonYield({ yieldObservations: [observation, second] }).value, '21,6 т/га');
});

test('сравнение связывает город с точным регионом допуска, не подменяя конфликтующие места', () => {
  const cities = [
    { name: 'Тула', region: 'Тульская область' },
    { name: 'Александровка', region: 'Тульская область' },
    { name: 'Александровка', region: 'Самарская область' }
  ];
  const regions = [
    { name_ru: 'Тульская область', admission_region_number: 3 },
    { name_ru: 'Москва', admission_region_number: null }
  ];
  const tula = resolveComparisonPlace({ city: 'Тула', region: 'Тульская область', cities, regions });
  assert.equal(tula.region.admission_region_number, 3);
  assert.deepEqual(resolveComparisonPlace({ city: 'Неизвестный город', region: 'Тульская область', cities, regions }), {
    city: null, region: null, reason: 'unknown-city'
  });
  assert.equal(resolveComparisonPlace({ city: 'Тула', region: 'Калужская область', cities, regions }).reason, 'conflicting-place');
  assert.equal(resolveComparisonPlace({ city: 'Александровка', cities, regions }).reason, 'ambiguous-city');
  assert.equal(resolveComparisonPlace({ city: 'александровка', region: 'Тульская область', cities, regions }).region.name_ru, 'Тульская область');
  const moscow = resolveComparisonPlace({ region: 'Москва', cities, regions });
  assert.equal(admissionForPlace({ admissions: [{ admission_region_number: 3 }] }, moscow), null);
  assert.equal(admissionForPlace({ admissions: [{ admission_region_number: 3 }] }, tula).admission_region_number, 3);
});

test('Москва и Петербург используют регион подбора и принимают прежние ссылки на город', () => {
  const cities = [
    { name: 'Москва', region: 'Москва', selectionRegion: 'Московская область' },
    { name: 'Санкт-Петербург', region: 'Санкт-Петербург', selectionRegion: 'Ленинградская область' }
  ];
  const regions = [
    { name_ru: 'Московская область', admission_region_number: 3 },
    { name_ru: 'Ленинградская область', admission_region_number: 2 }
  ];
  for (const city of cities) {
    for (const region of ['', city.region, city.selectionRegion]) {
      const place = resolveComparisonPlace({ city: city.name, region, cities, regions });
      assert.equal(place.reason, null);
      assert.equal(place.city, city);
      assert.equal(place.region.name_ru, city.selectionRegion);
      assert.equal(place.city.region, city.region);
    }
  }
  assert.equal(resolveComparisonPlace({ city: 'Москва', region: 'Ленинградская область', cities, regions }).reason, 'conflicting-place');
  assert.equal(resolveComparisonPlace({ city: 'Санкт-Петербург', region: 'Москва', cities, regions }).reason, 'conflicting-place');
});

test('различия не прячут неизвестное свойство рядом с известным и не сравнивают оформление текста', () => {
  assert.equal(hasComparisonDifference([null, null]), false);
  assert.equal(hasComparisonDifference([]), false);
  assert.equal(hasComparisonDifference(['Летняя малина']), false);
  assert.equal(hasComparisonDifference(['Летняя малина', null]), true);
  assert.equal(hasComparisonDifference(['Солнечное место', '  солнечное   место  ']), false);
  assert.equal(hasComparisonDifference(['Защищённый грунт', 'защищенный грунт']), false);
  assert.equal(hasComparisonDifference(['Ремонтантная', 'Летняя']), true);
});

test('равные числа из разных опытов остаются разными сведениями без назначения лучшего сорта', () => {
  const measurements = [
    '18 г · Коломна, Московская область · 2022–2023 · Открытый грунт',
    '18 г · Краснодарский край · 2020–2021 · Туннель'
  ];
  assert.equal(hasComparisonDifference(measurements), true);
  assert.equal(hasComparisonDifference(measurements.toReversed()), true);
  assert.equal(hasComparisonDifference([measurements[0], measurements[0]]), false);
});

test('поиск сортов понимает название, адрес и синоним, сохраняет записи и порядок', () => {
  const entries = [
    { name: 'Жёлтый гигант', slug: 'zheltyy-gigant', aliases: ['Yellow Giant', 'Желтоплодный гигант'], cropKey: 'raspberry' },
    { name: 'Полька', slug: 'polka', aliases: ['Polka'], cropKey: 'raspberry' },
    { name: 'Полана', slug: 'polana', aliases: [], cropKey: 'raspberry' },
    { name: null, slug: 'unknown-name', aliases: null, cropKey: 'raspberry' }
  ];
  for (const query of ['ЖЕЛТЫЙ', '  жёлтый  ', 'yellow giant', 'Желтоплодный', 'zheltyy-gigant']) {
    const found = searchComparisonVarieties(entries, query);
    assert.deepEqual(found, [entries[0]], query);
    assert.equal(found[0], entries[0], 'поиск возвращает исходную запись, а не имя');
  }
  assert.deepEqual(searchComparisonVarieties(entries, 'pola'), [entries[2]]);
  assert.deepEqual(searchComparisonVarieties(entries, 'неизвестный сорт'), []);
  assert.deepEqual(searchComparisonVarieties(entries, 'null'), []);
  assert.deepEqual(searchComparisonVarieties(entries, ''), entries);
  assert.deepEqual(searchComparisonVarieties(entries, '   '), entries);
});

test('возврат из сравнения открывает городской подбор и сохраняет только условия участка', () => {
  const city = { name: 'Москва', slug: 'moskva', region: 'Москва', selectionRegion: 'Московская область' };
  const place = resolveComparisonPlace({ city: city.name, region: 'Москва', cities: [city], regions: [{ name_ru: 'Московская область', admission_region_number: 3 }] });
  const href = comparisonPickerHref('raspberry', place, '?crop=strawberry&city=Тула&region=Тульская+область&setting=ground&light=sun&fruiting=remontant&harvestTiming=autumn&shelter=yes&drainage=drained&sort=polka,joan-j&diff=1&unexpected=1', '/MALINA');
  const url = new URL(href, 'https://example.test');
  assert.equal(url.pathname, '/MALINA/podbor/moskva/');
  assert.equal(url.searchParams.get('crop'), 'raspberry');
  assert.equal(url.searchParams.get('city'), 'Москва');
  assert.equal(url.searchParams.get('region'), 'Московская область');
  for (const [key, expected] of Object.entries({ setting: 'ground', light: 'sun', fruiting: 'remontant', harvestTiming: 'autumn', shelter: 'yes', drainage: 'drained' })) {
    assert.equal(url.searchParams.get(key), expected, key);
  }
  assert.equal(url.searchParams.has('sort'), false);
  assert.equal(url.searchParams.has('diff'), false);
  assert.equal(url.searchParams.has('unexpected'), false);
  assert.notEqual(url.searchParams.get('region'), 'Тульская область');
});

test('повторяющиеся параметры не подменяют условия при возврате в подбор', () => {
  const url = new URL(comparisonPickerHref('raspberry', null, '?setting=ground&setting=container&light=sun&drainage=wet&drainage=drained'), 'https://example.test');
  assert.equal(url.searchParams.has('setting'), false);
  assert.equal(url.searchParams.has('drainage'), false);
  assert.equal(url.searchParams.get('light'), 'sun');
});

test('возврат с одной областью сохраняет её, а неразрешённое место не наследует чужой город', () => {
  const region = { name_ru: 'Московская область', admission_region_number: 3 };
  const onlyRegion = resolveComparisonPlace({ region: 'Московская область', regions: [region] });
  const url = new URL(comparisonPickerHref('strawberry', onlyRegion, '?city=Москва&sort=clery&light=shade'), 'https://example.test');
  assert.equal(url.pathname, '/podbor/');
  assert.equal(url.searchParams.get('region'), region.name_ru);
  assert.equal(url.searchParams.get('crop'), 'strawberry');
  assert.equal(url.searchParams.get('light'), 'shade');
  assert.equal(url.searchParams.has('city'), false);
  for (const reason of ['unknown-city', 'ambiguous-city', 'conflicting-place']) {
    const unresolved = new URL(comparisonPickerHref('raspberry', { city: null, region: null, reason }, '?city=Москва&region=Московская+область&sort=polka'), 'https://example.test');
    assert.equal(unresolved.pathname, '/podbor/');
    assert.equal(unresolved.searchParams.has('city'), false, reason);
    assert.equal(unresolved.searchParams.has('region'), false, reason);
    assert.equal(unresolved.searchParams.get('crop'), 'raspberry');
  }
});

test('масса ягоды и урожайность сохраняют паспорт каждого опыта отдельно', () => {
  const weight = {
    trait_code: 'berry_weight_g', value_number: 18, value_max: null, unit: 'г',
    source_url: 'https://example.test/kolomna', source_title: 'Опыт в Подмосковье',
    evidence: { period_from: '2022', period_to: '2023', place_text: 'Коломна, Московская область', setting_text: 'Открытый грунт', source_locator: 'Таблица 1, Клери' }
  };
  const yieldObservation = { ...weight, trait_code: 'yield', value_number: 148.3, unit: 'ц/га' };
  const secondWeight = { ...weight, value_number: 14, source_url: 'https://example.test/second', evidence: { ...weight.evidence, place_text: 'Краснодарский край', period_from: '2020', period_to: '2021' } };
  const variety = { observations: [yieldObservation, weight, secondWeight] };
  assert.deepEqual(getComparisonMeasurements(variety, 'berry_weight_g'), [
    { value: '18 г', context: 'Коломна, Московская область · 2022–2023 · Открытый грунт', sourceUrl: weight.source_url, sourceTitle: weight.source_title, sourceLocator: weight.evidence.source_locator },
    { value: '14 г', context: 'Краснодарский край · 2020–2021 · Открытый грунт', sourceUrl: secondWeight.source_url, sourceTitle: weight.source_title, sourceLocator: weight.evidence.source_locator }
  ]);
  assert.deepEqual(getComparisonMeasurements(variety, 'yield'), getComparisonYields(variety));
  assert.deepEqual(getComparisonMeasurements(variety, 'unknown'), []);
});

test('массу ягоды без места, периода, условий или надёжного адреса не выдаём за измерение', () => {
  const weight = {
    trait_code: 'berry_weight_g', value_number: 3.7, unit: 'г', source_url: 'https://example.test/trial', source_title: 'Сортоиспытание',
    evidence: { period_from: '2023', period_to: '2024', place_text: 'Волоколамск', setting_text: 'Открытый грунт', source_locator: 'Таблица 2' }
  };
  const incomplete = [
    { ...weight, evidence: null },
    { ...weight, source_url: 'http://example.test/trial' },
    { ...weight, source_url: 'javascript:alert(1)' },
    { ...weight, source_title: '  ' },
    { ...weight, unit: '', value_text: '' },
    { ...weight, value_number: null, value_text: '' },
    ...['place_text', 'setting_text', 'source_locator'].map(field => ({ ...weight, evidence: { ...weight.evidence, [field]: '  ' } })),
    { ...weight, evidence: { ...weight.evidence, period_from: null, period_to: '  ' } }
  ];
  for (const observation of incomplete) assert.deepEqual(getComparisonMeasurements({ observations: [observation] }, 'berry_weight_g'), []);
  assert.equal(getComparisonMeasurements({ observations: [...incomplete, weight] }, 'berry_weight_g').length, 1);
});
