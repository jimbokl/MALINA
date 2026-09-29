const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

const regionWord = count => count === 1 ? 'региона' : 'регионов';

export function admissionSection(cultivar, { cities = [], regions = [] } = {}) {
  const admissions = cultivar?.admissions || [];
  if (!admissions.length) return '';
  const regionNames = new Map(regions.filter(region => Number.isInteger(region.admission_region_number))
    .map(region => [region.admission_region_number, region.admission_region_name]));
  const rows = admissions.map(item => {
    const name = regionNames.get(item.admission_region_number);
    const heading = name || `Регион ${item.admission_region_number}`;
    return `<li data-admission-region-number="${escapeHtml(item.admission_region_number)}"><strong>${escapeHtml(heading)}</strong></li>`;
  }).join('');
  const places = JSON.stringify({
    cities: cities.map(({ name, region }) => ({ name, region })),
    regions: regions.map(({ name_ru, admission_region_number, admission_region_name }) => ({ name_ru, admission_region_number, admission_region_name }))
  }).replaceAll('<', '\\u003c');
  return `<section class="section wrap admission-section" id="gosreestr"><span class="eyebrow">СОРТ И ВАШ РЕГИОН</span><h2>Ваш регион есть в списке?</h2><p class="admission-overview">Мы проверили список регионов: этот сорт есть в нём для ${admissions.length} ${regionWord(admissions.length)} России. Найдите свой регион ниже.</p><div class="admission-featured" hidden><p class="admission-place"></p><ul class="admission-list"></ul></div><details class="admission-more"><summary>Посмотреть регионы (${admissions.length})</summary><ul class="admission-list">${rows}</ul></details><script class="admission-place-data" type="application/json">${places}</script><script type="module" src="/assets/admissions.js"></script></section>`;
}
