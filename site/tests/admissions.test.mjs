import test from 'node:test';
import assert from 'node:assert/strict';
import { admissionSection } from '../admissions.mjs';
import { resolveAdmissionSelection } from '../assets/admissions-model.mjs';

const places = {
  cities: [
    { name: 'Рязань', region: 'Рязанская область' },
    { name: 'Владивосток', region: 'Приморский край' },
    { name: 'Москва', region: 'Москва' }
  ],
  regions: [
    { name_ru: 'Рязанская область', admission_region_name: 'Центральный', admission_region_number: 3 },
    { name_ru: 'Приморский край', admission_region_name: 'Дальневосточный', admission_region_number: 12 },
    { name_ru: 'Москва', admission_region_name: null, admission_region_number: null }
  ]
};

test('карточка показывает все регионы без повторения источника в каждой строке', () => {
  const admissions = Array.from({ length: 11 }, (_, index) => ({
    admission_region_number: index + 1, edition_as_of: '2024-05-31',
    registry_entry_code: '5801427', admitted_year: 1959,
    source_url: 'https://example.test/registry.pdf', source_pdf_page: 415
  }));
  const html = admissionSection({ admissions }, places);
  assert.match(html, /<details class="admission-more"><summary>Посмотреть регионы \(11\)<\/summary>/);
  assert.match(html, /<strong>Центральный<\/strong>/);
  assert.equal((html.match(/data-admission-region-number=/g) || []).length, 11);
  assert.doesNotMatch(html, /По изданию реестра|Открыть строку реестра/);
  assert.match(html, /Мы проверили список регионов: этот сорт есть в нём для 11 регионов России/);
});

test('карточка выделяет допуск только для однозначно установленного региона', () => {
  const numbers = Array.from({ length: 11 }, (_, index) => index + 1);
  const ryazan = resolveAdmissionSelection('?city=Рязань&region=Рязанская+область', places, numbers);
  assert.equal(ryazan.kind, 'admitted');
  assert.equal(ryazan.number, 3);
  assert.equal(resolveAdmissionSelection('?region=Рязанская+область', places, numbers).kind, 'admitted');
  assert.equal(resolveAdmissionSelection('?city=Владивосток&region=Приморский+край', places, numbers).kind, 'not-admitted');
  assert.equal(resolveAdmissionSelection('?region=Москва', places, numbers).kind, 'unmapped');
  assert.equal(resolveAdmissionSelection('?city=Москва&region=Москва', places, numbers).kind, 'unmapped');
  assert.equal(resolveAdmissionSelection('?city=Рязань&region=Приморский+край', places, numbers).kind, 'unknown');
  assert.equal(resolveAdmissionSelection('?city=Рязань&city=Владивосток', places, numbers).kind, 'unknown');
  assert.equal(resolveAdmissionSelection('', places, numbers).kind, 'none');
});

test('карточка сохраняет региональный допуск для прежнего и нового контекста Москвы и Петербурга', () => {
  const cityPlaces = {
    cities: [
      { name: 'Москва', region: 'Москва', selectionRegion: 'Московская область' },
      { name: 'Санкт-Петербург', region: 'Санкт-Петербург', selectionRegion: 'Ленинградская область' }
    ],
    regions: [
      { name_ru: 'Московская область', admission_region_name: 'Центральный', admission_region_number: 3 },
      { name_ru: 'Ленинградская область', admission_region_name: 'Северо-Западный', admission_region_number: 2 }
    ]
  };
  for (const region of ['Москва', 'Московская область']) {
    const selection = resolveAdmissionSelection(`?city=Москва&region=${encodeURIComponent(region)}`, cityPlaces, [3]);
    assert.equal(selection.kind, 'admitted');
    assert.equal(selection.number, 3);
    assert.equal(selection.place.region.name_ru, 'Московская область');
  }
  for (const region of ['Санкт-Петербург', 'Ленинградская область']) {
    const selection = resolveAdmissionSelection(`?city=Санкт-Петербург&region=${encodeURIComponent(region)}`, cityPlaces, [2]);
    assert.equal(selection.kind, 'admitted');
    assert.equal(selection.number, 2);
  }
  assert.equal(resolveAdmissionSelection('?city=Москва&region=Ленинградская+область', cityPlaces, [2, 3]).kind, 'unknown');
  assert.equal(resolveAdmissionSelection('?city=Санкт-Петербург&region=Московская+область', cityPlaces, [2, 3]).kind, 'unknown');
  assert.equal(resolveAdmissionSelection('?city=Москва&region=Москва', cityPlaces, [2]).kind, 'not-admitted');
});
