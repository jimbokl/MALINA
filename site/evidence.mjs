const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const evidenceKinds = {
  published_study: 'Исследование',
  farm_observation: 'Наблюдение хозяйства',
  reference_document: 'Справочный источник',
  expert_assessment: 'Экспертная оценка',
};
const publicEvidenceText = value => String(value)
  .replaceAll('RHS Plant Profile / introductory description', 'Вводное описание в карточке источника')
  .replaceAll('в справочной карточке RHS', 'в справочной карточке источника')
  .replaceAll('Описание RHS', 'Справочное описание')
  .replaceAll('Рекомендация RHS', 'Рекомендация источника')
  .replaceAll('у RHS', 'в источнике');

function sourceLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function observationLabel(item) {
  if (item.value_text) return item.value_text;
  if (Number.isFinite(item.value_number)) {
    const range = Number.isFinite(item.value_max) ? `${item.value_number}–${item.value_max}` : String(item.value_number);
    return `${range}${item.unit ? ` ${item.unit}` : ''}`;
  }
  return 'Свойство сорта';
}

export function evidenceSection(cultivar) {
  const observations = (cultivar?.observations || []).filter(item => item.evidence);
  if (!observations.length) return '';
  const cards = observations.map(item => {
    const proof = item.evidence;
    const url = sourceLink(item.source_url);
    const checkedOn = /^\d{4}-\d{2}-\d{2}/.exec(proof.reviewed_at || '')?.[0];
    return `<article class="evidence-card"><h3>${escapeHtml(observationLabel(item))}</h3><p>${escapeHtml(publicEvidenceText(item.context_text))}</p><dl><div><dt>Тип основания</dt><dd>${escapeHtml(evidenceKinds[proof.evidence_kind] || 'Источник')}</dd></div><div><dt>Основание</dt><dd>${escapeHtml(publicEvidenceText(proof.subject_description))}</dd></div><div><dt>Где в источнике</dt><dd>${escapeHtml(publicEvidenceText(proof.source_locator))}</dd></div><div><dt>Метод и выборка</dt><dd>${escapeHtml(publicEvidenceText(proof.method_text || 'Не указаны в источнике'))}${proof.sample_size != null ? ` · ${escapeHtml(proof.sample_size)} наблюдений` : ''}</dd></div><div><dt>Применимость</dt><dd>${escapeHtml(publicEvidenceText(proof.applicability_note))}</dd></div><div><dt>Ограничения</dt><dd>${escapeHtml(publicEvidenceText(proof.limitations_note))}</dd></div>${checkedOn ? `<div><dt>Проверено</dt><dd><time datetime="${checkedOn}">${checkedOn.split('-').reverse().join('.')}</time></dd></div>` : ''}</dl>${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(publicEvidenceText(item.source_title))} ↗</a>` : ''}</article>`;
  }).join('');
  return `<section class="section wrap evidence-section" id="osnovaniya"><div class="section-head"><div><span class="eyebrow">ПАСПОРТ ДАННЫХ</span><h2>Что подтверждает источник</h2><p>Каждое утверждение относится к указанному источнику и условиям. Оно не заменяет местное испытание сорта.</p></div></div><div class="evidence-grid">${cards}</div></section>`;
}
