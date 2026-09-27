const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

const regionWord = count => count % 100 >= 11 && count % 100 <= 14 ? 'регионов'
  : count % 10 === 1 ? 'регион' : count % 10 >= 2 && count % 10 <= 4 ? 'региона' : 'регионов';

export function admissionSection(cultivar, { cities = [], regions = [] } = {}) {
  const admissions = cultivar?.admissions || [];
  if (!admissions.length) return '';
  const regionNames = new Map(regions.filter(region => Number.isInteger(region.admission_region_number))
    .map(region => [region.admission_region_number, region.admission_region_name]));
  const rows = admissions.map(item => {
    const sourceUrl = `${item.source_url}${item.source_pdf_page ? `#page=${item.source_pdf_page}` : ''}`;
    const name = regionNames.get(item.admission_region_number);
    const heading = name ? `${name} · регион ${item.admission_region_number}` : `Регион допуска ${item.admission_region_number}`;
    return `<li data-admission-region-number="${escapeHtml(item.admission_region_number)}"><strong>${escapeHtml(heading)}</strong><span>По изданию реестра на ${escapeHtml(item.edition_as_of)} · запись ${escapeHtml(item.registry_entry_code)}, год включения ${escapeHtml(item.admitted_year)}.</span><a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Открыть строку реестра ↗</a></li>`;
  }).join('');
  const places = JSON.stringify({
    cities: cities.map(({ name, region }) => ({ name, region })),
    regions: regions.map(({ name_ru, admission_region_number, admission_region_name }) => ({ name_ru, admission_region_number, admission_region_name }))
  }).replaceAll('<', '\\u003c');
  return `<section class="section wrap admission-section" id="gosreestr"><span class="eyebrow">ОФИЦИАЛЬНЫЙ ДОПУСК</span><h2>Допуск в Госреестре</h2><p class="admission-overview">Допуск указан для ${admissions.length} ${regionWord(admissions.length)} Госреестра.</p><div class="admission-featured" hidden><p class="admission-place"></p><ul class="admission-list"></ul></div><details class="admission-more"><summary>Все регионы допуска (${admissions.length})</summary><ul class="admission-list">${rows}</ul></details><script class="admission-place-data" type="application/json">${places}</script><script type="module" src="/assets/admissions.js"></script></section>`;
}
