import { resolveAdmissionSelection } from './admissions-model.mjs';

const section = document.querySelector('.admission-section');
if (section) {
  const places = JSON.parse(section.querySelector('.admission-place-data').textContent);
  const allList = section.querySelector('.admission-more .admission-list');
  const rows = [...allList.children];
  const selection = resolveAdmissionSelection(location.search, places, rows.map(row => Number(row.dataset.admissionRegionNumber)));
  const overview = section.querySelector('.admission-overview');
  const label = selection.place && [selection.place.city?.name, selection.place.region.name_ru].filter(Boolean).join(', ');

  if (selection.kind === 'admitted') {
    const row = rows.find(item => Number(item.dataset.admissionRegionNumber) === selection.number);
    const featured = section.querySelector('.admission-featured');
    featured.querySelector('.admission-place').textContent = `${label} — есть официальный допуск: ${selection.place.region.admission_region_name} регион № ${selection.number}.`;
    featured.querySelector('.admission-list').append(row);
    featured.hidden = false;
    overview.hidden = true;
    const more = section.querySelector('.admission-more');
    if (rows.length === 1) more.hidden = true;
    else more.querySelector('summary').textContent = `Другие регионы допуска (${rows.length - 1})`;
  } else if (selection.kind === 'not-admitted') {
    overview.textContent = `${label} — допуск в этой записи Госреестра не указан.`;
  } else if (selection.kind === 'unmapped') {
    overview.textContent = `${label} — регион допуска не сопоставлен.`;
  } else if (selection.kind === 'unknown') {
    overview.textContent = 'Не удалось определить регион по ссылке. Все регионы допуска — в списке ниже.';
  }
}
