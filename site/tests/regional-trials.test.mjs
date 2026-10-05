import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getRegionalTrials } from '../assets/regional-trials.mjs';

const region = 'moscow-oblast';

function observation(overrides = {}, evidenceOverrides = {}) {
  return {
    trait_code: 'yield', value_number: 7.25, value_max: null, unit: 'т/га',
    region_code: region, source_key: 'trial-2024',
    source_url: 'https://example.test/trial.pdf', source_title: 'Полевое испытание сортов',
    evidence: {
      evidence_kind: 'published_study', place_text: 'Волоколамский район, Московская область',
      setting_text: 'Открытый грунт; сравнительный опыт', period_from: '2023', period_to: '2024',
      source_locator: 'Таблица 1, строка сорта', method_text: 'Четыре повторности',
      uncertainty_text: 'Один участок', ...evidenceOverrides
    },
    ...overrides
  };
}

function cultivar(slug, crop = 'raspberry', observations = [observation()]) {
  return { slug, canonical_name: `Сорт ${slug}`, crop_slug: crop, observations };
}

function catalog(...cultivars) {
  return {
    schema_version: 1,
    regions: [
      { code: region, name_ru: 'Московская область', admission_region_number: 3 },
      { code: 'tula-oblast', name_ru: 'Тульская область', admission_region_number: 3 }
    ],
    cultivars
  };
}

test('местный результат сохраняет измерение, место, годы и проверяемый источник', () => {
  const result = getRegionalTrials(catalog(cultivar('trial')), region);
  assert.deepEqual(result, [{
    slug: 'trial', name: 'Сорт trial', cropSlug: 'raspberry',
    findings: [{
      traitCode: 'yield', label: 'Урожай в испытании', value: '7,25 т/га', period: '2023–2024',
      place: 'Волоколамский район, Московская область', placeLabel: 'Волоколамский район, Московская область', conditions: 'Открытый грунт; сравнительный опыт',
      sourceUrl: 'https://example.test/trial.pdf', sourceTitle: 'Полевое испытание сортов',
      sourceLocator: 'Таблица 1, строка сорта', method: 'Четыре повторности', uncertainty: 'Один участок',
      sourceKey: 'trial-2024', year: 2024
    }]
  }]);
  assert.ok(!('score' in result[0]));
  assert.ok(!('recommendation' in result[0]));
});

test('совпадение региона допуска не переносит испытание в другой субъект РФ', () => {
  const local = cultivar('local');
  local.admissions = [{ admission_region_number: 3, source_url: 'https://example.test/registry.pdf' }];
  local.recommendations = [{ region_code: 'tula-oblast', score: 100 }];
  const admittedOnly = cultivar('admitted-only', 'strawberry', []);
  admittedOnly.admissions = local.admissions;
  const data = catalog(local, admittedOnly);
  assert.deepEqual(getRegionalTrials(data, 'tula-oblast'), []);
  assert.deepEqual(getRegionalTrials(data, region).map(item => item.slug), ['local']);
  for (const other of ['Московская область', 'moscow', 'Moscow-oblast', ` ${region} `, '', null, undefined]) {
    assert.deepEqual(getRegionalTrials(data, other), [], String(other));
  }
});

test('выбор культуры не смешивает малину и клубнику', () => {
  const data = catalog(
    cultivar('raspberry'),
    cultivar('strawberry', 'strawberry'),
    cultivar('elsewhere', 'strawberry', [observation({ region_code: 'ryazan-oblast' })])
  );
  assert.deepEqual(getRegionalTrials(data, region).map(item => item.slug), ['raspberry', 'strawberry']);
  assert.deepEqual(getRegionalTrials(data, region, 'raspberry').map(item => item.slug), ['raspberry']);
  assert.deepEqual(getRegionalTrials(data, region, 'strawberry').map(item => item.slug), ['strawberry']);
  assert.deepEqual(getRegionalTrials(data, region, 'unknown-crop'), []);
});

test('принимаются только измерения урожая и массы ягоды, а не общие свойства сорта', () => {
  const data = catalog(cultivar('traits', 'raspberry', [
    observation(),
    observation({ trait_code: 'berry_weight_g', value_number: 4.5, unit: 'г' }),
    observation({ trait_code: 'berry_weight', value_number: 4.5, unit: 'г' }),
    observation({ trait_code: 'winter_hardiness' }),
    observation({ trait_code: 'flavor', value_text: 'sweet' })
  ]));
  const findings = getRegionalTrials(data, region)[0].findings;
  assert.deepEqual(findings.map(item => item.traitCode), ['yield', 'berry_weight_g']);
  assert.equal(findings[1].label, 'Масса ягоды');
  assert.equal(findings[1].value, '4,5 г');
});

test('текстовые, нулевые, отрицательные и нечисловые значения не становятся результатом опыта', () => {
  for (const value_number of [undefined, null, NaN, Infinity, -Infinity, 0, -2, '7.25']) {
    const data = catalog(cultivar('invalid', 'raspberry', [observation({ value_number, value_text: '7,25 т/га' })]));
    assert.deepEqual(getRegionalTrials(data, region), [], `value_number=${String(value_number)}`);
  }
  for (const unit of [undefined, null, '', '  ']) {
    assert.deepEqual(getRegionalTrials(catalog(cultivar('invalid', 'raspberry', [observation({ unit })])), region), []);
  }
});

test('неполный паспорт доказательства и неподходящий вид источника скрывают измерение', () => {
  for (const evidence of [undefined, null, {}]) {
    assert.deepEqual(getRegionalTrials(catalog(cultivar('invalid', 'raspberry', [observation({ evidence })])), region), []);
  }
  for (const field of ['place_text', 'setting_text', 'source_locator']) {
    for (const value of [undefined, null, '', '  ']) {
      const data = catalog(cultivar('invalid', 'raspberry', [observation({}, { [field]: value })]));
      assert.deepEqual(getRegionalTrials(data, region), [], `${field}=${String(value)}`);
    }
  }
  for (const evidence_kind of [undefined, 'reference_document', 'expert_assessment', 'state_register_admission']) {
    assert.deepEqual(getRegionalTrials(catalog(cultivar('invalid', 'raspberry', [observation({}, { evidence_kind })])), region), []);
  }
  assert.deepEqual(getRegionalTrials(catalog(cultivar('invalid', 'raspberry', [
    observation({}, { period_from: ' ', period_to: null })
  ])), region), []);
});

test('местное полевое наблюдение принимается с одним годом и без необязательной методики', () => {
  const data = catalog(cultivar('field', 'strawberry', [observation({}, {
    evidence_kind: 'field_observation', period_from: null, period_to: '2025',
    method_text: null, uncertainty_text: null
  })]));
  const finding = getRegionalTrials(data, region, 'strawberry')[0].findings[0];
  assert.equal(finding.period, '2025');
  assert.equal(finding.year, 2025);
  assert.equal(finding.method, '');
  assert.equal(finding.uncertainty, '');
  for (const endpoints of [
    { period_from: '2025', period_to: null },
    { period_from: '2025', period_to: '2025' }
  ]) {
    const result = getRegionalTrials(catalog(cultivar('one-year', 'raspberry', [observation({}, endpoints)])), region);
    assert.equal(result[0].findings[0].period, '2025');
  }
});

test('измерение требует названия первоисточника и HTTPS-ссылки', () => {
  for (const source_url of [undefined, null, '', '/trial.pdf', 'http://example.test/trial.pdf', 'javascript:alert(1)', 'not-a-url']) {
    assert.deepEqual(getRegionalTrials(catalog(cultivar('invalid', 'raspberry', [observation({ source_url })])), region), [], String(source_url));
  }
  for (const source_title of [undefined, null, '', '  ']) {
    assert.deepEqual(getRegionalTrials(catalog(cultivar('invalid', 'raspberry', [observation({ source_title })])), region), []);
  }
});

test('свежие опыты идут первыми, а урожай предшествует массе ягоды за один год', () => {
  const data = catalog(cultivar('sorted', 'raspberry', [
    observation({ source_key: 'old' }, { period_from: '2016', period_to: '2018' }),
    observation({ source_key: 'new', trait_code: 'berry_weight_g', value_number: 4, unit: 'г' }, { period_from: '2025', period_to: null }),
    observation({ source_key: 'new' }, { period_from: '2024', period_to: '2025' })
  ]));
  assert.deepEqual(getRegionalTrials(data, region)[0].findings.map(item => [item.year, item.traitCode]), [
    [2025, 'yield'], [2025, 'berry_weight_g'], [2018, 'yield']
  ]);
});

test('повтор одного источника и признака оставляет свежую запись внутри сорта', () => {
  const shared = [
    observation({ value_number: 5 }, { period_from: '2020', period_to: '2020' }),
    observation({ value_number: 8 }, { period_from: '2025', period_to: '2025' }),
    observation({ trait_code: 'berry_weight_g', value_number: 4, unit: 'г' }, { period_from: '2025', period_to: '2025' }),
    observation({ source_key: 'independent-study', source_url: 'https://example.test/other.pdf', value_number: 6 })
  ];
  const results = getRegionalTrials(catalog(cultivar('first', 'raspberry', shared), cultivar('second')), region);
  assert.equal(results[0].findings.length, 3);
  assert.equal(results[0].findings[0].value, '8 т/га');
  assert.deepEqual(results[0].findings.map(item => `${item.sourceKey}:${item.traitCode}`), [
    'trial-2024:yield', 'trial-2024:berry_weight_g', 'independent-study:yield'
  ]);
  assert.equal(results[1].findings.length, 1);
});

test('поиск и сортировка оставляют исходный каталог неизменным', () => {
  const data = catalog(cultivar('immutable', 'raspberry', [
    observation({ source_key: 'old' }, { period_to: '2010' }),
    observation({ source_key: 'new' }, { period_to: '2025' })
  ]));
  const before = structuredClone(data);
  const freeze = value => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
  };
  freeze(data);
  const result = getRegionalTrials(data, region);
  assert.equal(result[0].findings[0].year, 2025);
  result[0].findings[0].place = 'Другое место';
  assert.deepEqual(data, before);
});

test('пустой или отсутствующий каталог даёт пустой список местных испытаний', () => {
  for (const data of [undefined, null, {}, { cultivars: null }, catalog(), catalog(cultivar('empty', 'raspberry', []))]) {
    assert.deepEqual(getRegionalTrials(data, region), []);
  }
});

test('реальный экспорт сохраняет измерения Подмосковья и Рязани в своих регионах', async context => {
  let data;
  try {
    data = JSON.parse(await readFile(new URL('../../dist/data/catalog.json', import.meta.url), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    context.skip('Публичный каталог появится после сборки');
    return;
  }
  const moscow = getRegionalTrials(data, region, 'raspberry');
  const gold = moscow.find(item => item.slug === 'zolotye-kupola');
  assert.ok(gold, 'Опыт «Золотых куполов» в Волоколамском районе доступен');
  assert.equal(gold.name, 'Золотые купола');
  assert.equal(gold.findings[0].value, '10,5 т/га');
  assert.equal(gold.findings[0].period, '2023–2024');
  assert.match(gold.findings[0].place, /Волоколамск/);
  assert.ok(gold.findings[0].method);
  assert.ok(gold.findings[0].uncertainty);
  assert.ok(moscow.every(item => item.cropSlug === 'raspberry'));

  const ryazan = getRegionalTrials(data, 'ryazan-oblast', 'strawberry');
  const borovitskaya = ryazan.find(item => item.slug === 'borovitskaya');
  assert.ok(borovitskaya, 'Контрольный опыт «Боровицкой» остаётся в Рязанской области');
  assert.equal(borovitskaya.findings.length, 1, 'Две строки одного признака и источника не дублируют сорт');
  assert.equal(borovitskaya.findings[0].period, '2013–2016');
  assert.match(borovitskaya.findings[0].place, /Рязанск/);
  assert.ok(!getRegionalTrials(data, 'ryazan-oblast').some(item => item.slug === 'zolotye-kupola'));
  assert.ok(!getRegionalTrials(data, region).some(item => item.slug === 'borovitskaya'));
  for (const item of [...moscow, ...ryazan]) {
    const original = data.cultivars.find(value => value.slug === item.slug);
    for (const finding of item.findings) {
      assert.equal(new URL(finding.sourceUrl).protocol, 'https:');
      assert.ok(finding.sourceTitle && finding.sourceLocator && finding.conditions);
      const requestedRegion = item.cropSlug === 'raspberry' ? region : 'ryazan-oblast';
      assert.ok(original.observations.some(value => value.region_code === requestedRegion &&
        value.source_key === finding.sourceKey && value.trait_code === finding.traitCode));
    }
  }
});

test('московский экспорт показывает обе культуры и сохраняет годы и диапазоны пяти сортов', async context => {
  let data;
  try {
    data = JSON.parse(await readFile(new URL('../../dist/data/catalog.json', import.meta.url), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    context.skip('Публичный каталог появится после сборки');
    return;
  }
  const all = getRegionalTrials(data, region);
  const expected = [
    ['zolotye-kupola', 'raspberry', 'yield', '10,5 т/га', '2023–2024'],
    ['zolotye-kupola', 'raspberry', 'berry_weight_g', '3,7 г', '2023–2024'],
    ['kleri', 'strawberry', 'berry_weight_g', '18 г', '2022–2023'],
    ['honey', 'strawberry', 'yield', '85–162,2 ц/га', '2010–2012'],
    ['rusich', 'strawberry', 'yield', '55,6–100,3 ц/га', '2010–2012'],
    ['rusich', 'strawberry', 'yield', '148,3 ц/га', '2006–2007'],
    ['zenga-zengana', 'strawberry', 'yield', '127,5 ц/га', '2006–2007']
  ];
  for (const [slug, crop, trait, value, period] of expected) {
    const item = all.find(candidate => candidate.slug === slug);
    assert.ok(item, `Московское испытание сорта ${slug} присутствует`);
    assert.equal(item.cropSlug, crop);
    const finding = item.findings.find(candidate => candidate.traitCode === trait && candidate.period === period);
    assert.ok(finding, `${slug}: ${trait}, ${period}`);
    assert.equal(finding.value, value);
    assert.match(finding.place, /Московск/);
    assert.ok(finding.conditions && finding.method && finding.sourceLocator);
    assert.equal(new URL(finding.sourceUrl).protocol, 'https:');
    assert.ok(getRegionalTrials(data, region, crop).some(candidate => candidate.slug === slug));
    assert.ok(!getRegionalTrials(data, region, crop === 'raspberry' ? 'strawberry' : 'raspberry')
      .some(candidate => candidate.slug === slug));
  }
  const gold = all.find(item => item.slug === 'zolotye-kupola');
  assert.deepEqual(gold.findings.map(item => item.traitCode), ['yield', 'berry_weight_g']);
  const rusich = all.find(item => item.slug === 'rusich');
  assert.deepEqual(rusich.findings.map(item => item.period), ['2010–2012', '2006–2007']);
  const admissionOnly = getRegionalTrials(data, 'tula-oblast');
  assert.ok(!admissionOnly.some(item => expected.some(([slug]) => slug === item.slug)));
});
