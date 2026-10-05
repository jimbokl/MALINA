import { admissionForPlace, comparisonHref, comparisonPickerHref, cultivarHref, getComparisonFacts, getComparisonLabels, getComparisonMeasurements, hasComparisonDifference, MAX_COMPARISON, parseSelection, resolveComparisonPlace, searchComparisonVarieties, toggleSelection } from './comparison-model.mjs';

const root = document.querySelector('#comparison');
if (root) {
  const data = JSON.parse(document.querySelector('#comparison-data').textContent);
  const varieties = data.varieties;
  const cropKey = root.dataset.crop;
  const params = new URLSearchParams(location.search);
  let selection = params.has('sort') ? parseSelection(params.get('sort'), varieties, cropKey) : varieties.slice(0, 4).map(item => item.slug);
  const choices = [...root.querySelectorAll('input[name="cultivar"]')];
  const status = root.querySelector('#comparison-status');
  const head = root.querySelector('.comparison-table thead tr');
  const body = root.querySelector('#comparison-rows');
  const table = root.querySelector('.comparison-table');
  const tableWrap = root.querySelector('.comparison-table-wrap');
  const chooser = root.querySelector('#comparison-chooser');
  const sources = root.querySelector('#comparison-sources');
  const sourceList = sources.querySelector('ul');
  const differences = root.querySelector('#comparison-differences');
  const selectedStrip = root.querySelector('#comparison-selected');
  const copy = root.querySelector('#comparison-copy');
  const fallback = root.querySelector('#comparison-share-fallback');
  const shareInput = root.querySelector('#comparison-share-url');
  const search = root.querySelector('#comparison-search');
  const nextSteps = root.querySelector('#comparison-next');
  const siteBase = document.documentElement.dataset.siteBase || '';
  const city = (params.get('city') || '').trim();
  const region = (params.get('region') || '').trim();
  const place = params.getAll('city').length > 1 || params.getAll('region').length > 1
    ? { city: null, region: null, reason: 'conflicting-place' }
    : resolveComparisonPlace({ city, region, cities: data.cities, regions: data.regions });
  const context = root.querySelector('#comparison-context');
  const placeLabel = [place.city?.name, place.region?.name_ru].filter(Boolean).join(' · ');
  const plural = new Intl.PluralRules('ru');
  const countLabel = count => `${count} ${{ one: 'сорт', few: 'сорта', many: 'сортов', other: 'сорта' }[plural.select(count)]}`;
  let notice = '';
  differences.checked = params.getAll('diff').length === 1 && params.get('diff') === '1';
  root.querySelector('#comparison-tools').hidden = false;
  chooser.hidden = false;
  root.querySelector('#comparison-return-picker').href = comparisonPickerHref(cropKey, place, location.search, siteBase);
  if (city || region) {
    context.hidden = false;
    context.textContent = place.region ? `Ваш участок: ${placeLabel}.` : 'Не нашли этот город или регион. Вернитесь к подбору и выберите место из списка.';
  }
  for (const input of choices) {
    input.closest('.comparison-choice').querySelector('a').href = cultivarHref(input.value, { city, region, siteBase });
  }

  function shareHref() {
    const searchParams = new URLSearchParams(location.search);
    if (differences.checked) searchParams.set('diff', '1');
    else searchParams.delete('diff');
    return comparisonHref(cropKey, selection, searchParams.toString(), siteBase);
  }

  function filterChoices() {
    const matching = new Set(searchComparisonVarieties(varieties, search.value).map(item => item.slug));
    for (const input of choices) input.closest('.comparison-choice').hidden = !matching.has(input.value);
    root.querySelector('#comparison-search-count').textContent = search.value.trim() ? `Нашли ${countLabel(matching.size)}` : `В каталоге ${countLabel(varieties.length)}`;
    root.querySelector('#comparison-search-empty').hidden = matching.size > 0;
  }

  function update() {
    const evidence = new Map();
    const remember = (url, label, detail = '') => {
      if (url && label) evidence.set(`${url}|${label}|${detail}`, { url, label, detail });
    };
    const selected = selection.map(slug => varieties.find(item => item.slug === slug)).filter(Boolean);
    for (const input of choices) {
      input.checked = selection.includes(input.value);
      input.disabled = !input.checked && selected.length >= MAX_COMPARISON;
    }
    status.textContent = notice || (selected.length === 0 ? 'Выберите от двух до четырёх сортов.' : selected.length === 1 ? 'Добавьте ещё один сорт для сравнения.' : `Выбрано ${countLabel(selected.length)}.`);
    copy.disabled = selected.length < 2;
    differences.disabled = selected.length < 2;
    root.querySelector('#comparison-clear').disabled = selected.length === 0;
    fallback.hidden = true;
    selectedStrip.replaceChildren();
    for (const item of selected) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'comparison-chip';
      button.textContent = `${item.name} ×`;
      button.setAttribute('aria-label', `Убрать сорт ${item.name} из сравнения`);
      button.addEventListener('click', () => {
        selection = selection.filter(slug => slug !== item.slug);
        notice = '';
        update();
        (selectedStrip.querySelector('button') || search).focus();
        if (!selectedStrip.querySelector('button')) chooser.open = true;
      });
      selectedStrip.append(button);
    }
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
    let visibleRows = 0;
    const facts = selected.map(getComparisonFacts);
    for (const [index, labelText] of getComparisonLabels(Boolean(place.region)).entries()) {
      const tr = document.createElement('tr');
      const label = document.createElement('th');
      label.scope = 'row';
      label.textContent = labelText;
      tr.append(label);
      const values = [];
      for (const [column, item] of selected.entries()) {
        const td = document.createElement('td');
        let value = '';
        if (index < facts[column].length) {
          value = facts[column][index][1] || '';
          td.textContent = value || '—';
          remember(item.source, `${item.name}: ${item.sourceLabel}`, `Проверено ${item.reviewedAt || root.dataset.reviewedAt}`);
        } else if (labelText === 'Урожайность' || labelText === 'Масса ягоды') {
          const studies = getComparisonMeasurements(item, labelText === 'Урожайность' ? 'yield' : 'berry_weight_g');
          value = studies.map(study => `${study.value} · ${study.context}`).sort().join('\n');
          if (!studies.length) td.textContent = '—';
          for (const study of studies) {
            const block = document.createElement('div');
            block.className = 'comparison-trial';
            const amount = document.createElement('strong');
            amount.textContent = study.value;
            const detail = document.createElement('small');
            detail.textContent = study.context;
            block.append(amount, detail);
            td.append(block);
            remember(study.sourceUrl, `${item.name}: ${study.sourceTitle}`, `${study.context} · ${study.sourceLocator}`);
          }
        } else {
          const admission = admissionForPlace(item, place);
          value = !Number.isInteger(place.region?.admission_region_number) ? 'Пока не можем сверить' : admission ? 'Есть в списке для вашего региона' : 'Запись для вашего региона не найдена';
          td.textContent = value;
          if (admission) remember(`${admission.source_url}${admission.source_pdf_page ? `#page=${admission.source_pdf_page}` : ''}`, `${item.name}: официальный список`, `Регион № ${admission.admission_region_number} · запись ${admission.registry_entry_code} · издание ${admission.edition_as_of.slice(0, 4)}`);
        }
        values.push(value);
        tr.append(td);
      }
      tr.hidden = differences.checked && !hasComparisonDifference(values);
      if (!tr.hidden) visibleRows++;
      body.append(tr);
    }
    table.hidden = selected.length < 2;
    tableWrap.hidden = selected.length < 2;
    root.querySelector('#comparison-empty-differences').hidden = selected.length < 2 || visibleRows > 0;
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
    nextSteps.replaceChildren();
    nextSteps.hidden = selected.length < 2;
    if (selected.length >= 2) {
      const title = document.createElement('h2');
      title.textContent = 'Познакомимся с сортами ближе';
      const grid = document.createElement('div');
      grid.className = 'comparison-next-grid';
      for (const item of selected) {
        const card = document.createElement('article');
        card.className = 'comparison-next-card';
        const name = document.createElement('h3');
        name.textContent = item.name;
        const links = document.createElement('div');
        links.className = 'comparison-next-links';
        const href = cultivarHref(item.slug, { city, region, siteBase });
        for (const [label, target] of [['Описание сорта ↗', href], ['Отзывы садоводов ↗', `${href}#otzyvy`]]) {
          const link = document.createElement('a');
          link.textContent = label;
          link.href = target;
          links.append(link);
        }
        if (/^\/magazin\/[a-z0-9-]+\/$/.test(item.shopHref || '')) {
          const link = document.createElement('a');
          const productParams = new URLSearchParams();
          if (city) productParams.set('city', city);
          if (region) productParams.set('region', region);
          link.href = `${siteBase}${item.shopHref}${productParams.size ? `?${productParams}` : ''}`;
          link.textContent = 'Посмотреть саженцы ↗';
          links.append(link);
        }
        card.append(name, links);
        grid.append(card);
      }
      nextSteps.append(title, grid);
    }
    if (selected.length < 2) chooser.open = true;
    history.replaceState(null, '', shareHref());
  }

  for (const input of choices) input.addEventListener('change', () => {
    const result = toggleSelection(selection, input.value, varieties, cropKey);
    selection = result.selection;
    notice = result.reason === 'limit' ? 'Можно сравнить до четырёх сортов одновременно.' : '';
    update();
  });
  search.addEventListener('input', filterChoices);
  differences.addEventListener('change', () => { notice = ''; update(); });
  root.querySelector('#comparison-clear').addEventListener('click', () => { selection = []; notice = ''; update(); search.focus(); });
  copy.addEventListener('click', async () => {
    const url = new URL(shareHref(), location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      fallback.hidden = true;
      status.textContent = 'Ссылка скопирована. Можно отправить её или сохранить.';
    } catch {
      shareInput.value = url;
      fallback.hidden = false;
      shareInput.focus();
      shareInput.select();
      status.textContent = 'Выделили ссылку ниже — скопируйте её вручную.';
    }
  });
  filterChoices();
  update();
}
