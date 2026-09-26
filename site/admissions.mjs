const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

export function admissionSection(cultivar) {
  const admissions = cultivar?.admissions || [];
  if (!admissions.length) return '';
  const rows = admissions.map(item => {
    const sourceUrl = `${item.source_url}${item.source_pdf_page ? `#page=${item.source_pdf_page}` : ''}`;
    return `<li><strong>Регион допуска ${escapeHtml(item.admission_region_number)}</strong><span>По изданию реестра на ${escapeHtml(item.edition_as_of)} · запись ${escapeHtml(item.registry_entry_code)}, год включения ${escapeHtml(item.admitted_year)}.</span><a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Открыть строку реестра ↗</a></li>`;
  }).join('');
  return `<section class="section wrap admission-section" id="gosreestr"><span class="eyebrow">ОФИЦИАЛЬНЫЙ ДОПУСК</span><h2>Что есть в Госреестре</h2><ul class="admission-list">${rows}</ul><p>Найдите свой регион в списке и откройте строку реестра с данными о сорте.</p></section>`;
}
