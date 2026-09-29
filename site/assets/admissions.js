import { resolveAdmissionSelection } from './admissions-model.mjs';

const section = document.querySelector('.admission-section');
if (section) {
  const places = JSON.parse(section.querySelector('.admission-place-data').textContent);
  const allList = section.querySelector('.admission-more .admission-list');
  const rows = [...allList.children];
  const selection = resolveAdmissionSelection(location.search, places, rows.map(row => Number(row.dataset.admissionRegionNumber)));
  const overview = section.querySelector('.admission-overview');
  const label = selection.place && [...new Set([selection.place.city?.name, selection.place.region?.name_ru].filter(Boolean))].join(', ');

  if (selection.kind === 'admitted') {
    const row = rows.find(item => Number(item.dataset.admissionRegionNumber) === selection.number);
    const featured = section.querySelector('.admission-featured');
    featured.querySelector('.admission-place').textContent = `${label}: сорт есть в списке для региона «${selection.place.region.admission_region_name}».`;
    featured.querySelector('.admission-list').append(row);
    featured.hidden = false;
    overview.hidden = true;
    const more = section.querySelector('.admission-more');
    if (rows.length === 1) more.hidden = true;
    else more.querySelector('summary').textContent = `Другие регионы (${rows.length - 1})`;
  } else if (selection.kind === 'not-admitted') {
    overview.textContent = `${label}: мы не нашли сорт в списке для этого региона. Ниже можно посмотреть, где он есть.`;
  } else if (selection.kind === 'unmapped') {
    overview.textContent = `Вы выбрали ${label}. Посмотрите список регионов ниже.`;
  } else if (selection.kind === 'unknown') {
    overview.textContent = 'Выберите свой город или посмотрите список регионов ниже.';
  }
}
