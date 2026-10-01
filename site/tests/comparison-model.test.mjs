import test from 'node:test';
import assert from 'node:assert/strict';
import { admissionForPlace, comparisonHref, cultivarHref, getComparisonFacts, getComparisonLabels, getComparisonYield, getComparisonYields, parseSelection, resolveComparisonPlace, toggleSelection } from '../assets/comparison-model.mjs';
import { varieties } from '../data.mjs';

test('общая ссылка сохраняет город и регион вместе с выбором сортов', () => {
  assert.equal(
    comparisonHref('raspberry', ['polka', 'joan-j'], '?city=Калининград&region=Калининградская+область', '/MALINA'),
    '/MALINA/sravnenie/malina/?city=%D0%9A%D0%B0%D0%BB%D0%B8%D0%BD%D0%B8%D0%BD%D0%B3%D1%80%D0%B0%D0%B4&region=%D0%9A%D0%B0%D0%BB%D0%B8%D0%BD%D0%B8%D0%BD%D0%B3%D1%80%D0%B0%D0%B4%D1%81%D0%BA%D0%B0%D1%8F+%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C&sort=polka%2Cjoan-j'
  );
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
    'Культура', 'Тип плодоношения', 'Когда созревает', 'Где изучали сорт', 'Коротко о сорте', 'Урожайность'
  ]);
  assert.deepEqual(getComparisonLabels(true), [
    'Культура', 'Тип плодоношения', 'Когда созревает', 'Где изучали сорт', 'Коротко о сорте', 'Урожайность', 'Есть ли сорт в официальном списке'
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
