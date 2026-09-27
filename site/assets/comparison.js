import { admissionForPlace, comparisonHref, cultivarHref, getComparisonFacts, getComparisonLabels, getComparisonYields, parseSelection, resolveComparisonPlace, toggleSelection } from './comparison-model.mjs';

const root = document.querySelector('#comparison');
if (root) {
  const comparisonData = JSON.parse(document.querySelector('#comparison-data').textContent);
  const varieties = comparisonData.varieties;
  const cropKey = root.dataset.crop;
  const params = new URLSearchParams(location.search);
  const hasSharedSelection = params.has('sort');
  let selection = hasSharedSelection
    ? parseSelection(params.get('sort'), varieties, cropKey)
    : varieties.slice(0, 4).map(item => item.slug);
  const choices = [...root.querySelectorAll('input[name="cultivar"]')];
  const status = root.querySelector('#comparison-status');
  const head = root.querySelector('.comparison-table thead tr');
  const body = root.querySelector('#comparison-rows');
  const table = root.querySelector('.comparison-table');
  const tableWrap = root.querySelector('.comparison-table-wrap');
  const context = root.querySelector('#comparison-context');
  const chooser = root.querySelector('#comparison-chooser');
  const siteBase = document.documentElement.dataset.siteBase || '';
  const verbForms = count => count === 1 ? 'сорт' : count > 1 && count < 5 ? 'сорта' : 'сортов';
  let notice = '';
  const city = (params.get('city') || '').trim();
  const region = (params.get('region') || '').trim();
  const place = params.getAll('city').length > 1 || params.getAll('region').length > 1
    ? { city: null, region: null, reason: 'conflicting-place' }
    : resolveComparisonPlace({ city, region, cities: comparisonData.cities, regions: comparisonData.regions });
  for (const input of choices) {
    const link = input.closest('.comparison-choice')?.querySelector('a');
    if (link) link.href = cultivarHref(input.value, { city, region, siteBase });
  }
  if (city || region) {
    context.hidden = false;
    if (place.region?.admission_region_number) {
      const zone = place.region.admission_region_number;
      context.textContent = `Место сравнения: ${[place.city?.name, place.region.name_ru].filter(Boolean).join(', ')}. Ниже показаны записи Госреестра для региона допуска № ${zone}.`;
    } else if (place.region) {
      context.textContent = `Место сравнения: ${[place.city?.name, place.region.name_ru].filter(Boolean).join(', ')}. Номер региона допуска для него не сопоставлен.`;
    } else {
      context.textContent = `Для указанного места регион сравнения не определён: ${[city, region].filter(Boolean).join(', ')}.`;
    }
  }

  function update() {
    choices.forEach(input => { input.checked = selection.includes(input.value); });
    const selected = selection.map(slug => varieties.find(item => item.slug === slug)).filter(Boolean);
    status.textContent = notice || (selected.length < 2
      ? 'Выберите ещё хотя бы один сорт. Можно отметить до четырёх сортов одной культуры.'
      : `Выбрано ${selected.length} ${verbForms(selected.length)}. Ссылку можно скопировать и отправить.`);
    head.replaceChildren();
    const firstHead = document.createElement('th');
    firstHead.scope = 'col';
    firstHead.textContent = 'Параметр';
    head.append(firstHead);
    for (const item of selected) {
      const th = document.createElement('th');
      th.scope = 'col';
      const link = document.createElement('a');
      link.href = cultivarHref(item.slug, { city, region, siteBase });
      link.textContent = item.name;
      th.append(link);
      head.append(th);
    }
    body.replaceChildren();
    const factRows = selected.map(item => getComparisonFacts(item));
    const labels = getComparisonLabels(Boolean(place.region));
    for (let index = 0; index < labels.length; index++) {
      const tr = document.createElement('tr');
      const label = document.createElement('th');
      label.scope = 'row';
      label.textContent = labels[index];
      tr.append(label);
      for (let column = 0; column < selected.length; column++) {
        const item = selected[column];
        const td = document.createElement('td');
        if (index < factRows[column].length) {
          td.append(document.createTextNode(factRows[column][index][1] || 'Нет проверенных данных'));
          const source = document.createElement('a');
          source.className = 'comparison-source';
          source.href = item.source;
          source.target = '_blank';
          source.rel = 'noopener noreferrer';
          source.textContent = `${item.sourceLabel} · проверено ${item.reviewedAt || root.dataset.reviewedAt} ↗`;
          td.append(source);
        } else if (index === factRows[column].length) {
          const studies = getComparisonYields(item);
          if (!studies.length) {
            td.append(document.createTextNode('—'));
          } else {
            for (const yieldData of studies) {
              const study = document.createElement('div');
              study.className = 'comparison-yield';
              const value = document.createElement('strong');
              value.textContent = yieldData.value;
              study.append(value);
              if (yieldData.context) {
                const detail = document.createElement('small');
                detail.textContent = yieldData.context;
                study.append(detail);
              }
              const source = document.createElement('a');
              source.className = 'comparison-source';
              source.href = yieldData.sourceUrl;
              source.target = '_blank';
              source.rel = 'noopener noreferrer';
              source.textContent = `${yieldData.sourceTitle}${yieldData.sourceLocator ? ` · ${yieldData.sourceLocator}` : ''} ↗`;
              study.append(source);
              td.append(study);
            }
          }
        } else {
          const admission = admissionForPlace(item, place);
          if (!Number.isInteger(place.region.admission_region_number)) {
            td.append(document.createTextNode('Номер региона допуска не сопоставлен.'));
          } else if (!admission) {
            td.append(document.createTextNode(`В Госреестре 2024 года допуск для региона № ${place.region.admission_region_number} не указан.`));
          } else {
            td.append(document.createTextNode(`Регион № ${admission.admission_region_number} · запись ${admission.registry_entry_code} · издание ${admission.edition_as_of.slice(0, 4)}.`));
            const source = document.createElement('a');
            source.className = 'comparison-source';
            source.href = `${admission.source_url}${admission.source_pdf_page ? `#page=${admission.source_pdf_page}` : ''}`;
            source.target = '_blank';
            source.rel = 'noopener noreferrer';
            source.textContent = 'Строка Госреестра ↗';
            td.append(source);
          }
        }
        tr.append(td);
      }
      body.append(tr);
    }
    table.hidden = selected.length < 2;
    tableWrap.hidden = selected.length < 2;
    if (selected.length < 2 && chooser) chooser.open = true;
    const next = comparisonHref(cropKey, selection, location.search, siteBase);
    history.replaceState(null, '', next);
  }

  for (const input of choices) {
    input.addEventListener('change', () => {
      const result = toggleSelection(selection, input.value, varieties, cropKey);
      selection = result.selection;
      notice = result.reason === 'limit' ? 'Можно сравнить не более четырёх сортов одновременно.' : '';
      update();
    });
  }
  update();
}
