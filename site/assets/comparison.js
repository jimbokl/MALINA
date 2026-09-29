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
  const sources = root.querySelector('#comparison-sources');
  const sourceList = sources?.querySelector('ul');
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
      context.textContent = `Сравниваем сорта для ${[place.city?.name, place.region.name_ru].filter(Boolean).join(', ')}. Мы отметили, какие из них есть в официальном списке для этого региона.`;
    } else if (place.region) {
      context.textContent = `Сравниваем сорта для ${[place.city?.name, place.region.name_ru].filter(Boolean).join(', ')}. Для этого места мы пока не можем сверить официальный список.`;
    } else {
      context.textContent = 'Не получилось найти этот город или регион. Проверьте название и попробуйте ещё раз.';
    }
  }

  function update() {
    const evidence = new Map();
    const remember = (url, label, detail = '') => {
      if (!url || !label) return;
      evidence.set(`${url}|${label}`, { url, label, detail });
    };
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
          td.textContent = factRows[column][index][1] || 'Пока нет данных';
          remember(item.source, `${item.name}: ${item.sourceLabel}`, `Проверено ${item.reviewedAt || root.dataset.reviewedAt}`);
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
                detail.textContent = yieldData.context.split(' · ')[0];
                study.append(detail);
              }
              remember(yieldData.sourceUrl, `${item.name}: ${yieldData.sourceTitle}`, [yieldData.context, yieldData.sourceLocator].filter(Boolean).join(' · '));
              td.append(study);
            }
          }
        } else {
          const admission = admissionForPlace(item, place);
          if (!Number.isInteger(place.region.admission_region_number)) {
            td.textContent = 'Пока не можем сверить';
          } else if (!admission) {
            td.textContent = `Для ${place.region.name_ru} записи нет`;
          } else {
            td.textContent = `Есть для ${place.region.name_ru}`;
            remember(`${admission.source_url}${admission.source_pdf_page ? `#page=${admission.source_pdf_page}` : ''}`,
              `${item.name}: официальный список`,
              `Регион № ${admission.admission_region_number} · запись ${admission.registry_entry_code} · издание ${admission.edition_as_of.slice(0, 4)}`);
          }
        }
        tr.append(td);
      }
      body.append(tr);
    }
    table.hidden = selected.length < 2;
    tableWrap.hidden = selected.length < 2;
    if (sources && sourceList) {
      sourceList.replaceChildren();
      for (const item of evidence.values()) {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = item.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = item.label;
        li.append(link);
        if (item.detail) li.append(document.createTextNode(` · ${item.detail}`));
        sourceList.append(li);
      }
      sources.hidden = selected.length < 2 || !evidence.size;
    }
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
