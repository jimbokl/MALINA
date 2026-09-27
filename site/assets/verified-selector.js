const form = document.querySelector('#picker-form');

if (form) {
  const base = document.documentElement.dataset.siteBase || '';
  const status = document.querySelector('#verified-status');
  const results = document.querySelector('#verified-results');
  let catalogPromise;
  let engine;
  let requestId = 0;
  const pickerCards = [...document.querySelectorAll('#picker-results .variety-card[data-cultivar-slug]')];
  const pickerResults = document.querySelector('#picker-results');
  const admissionStatus = document.querySelector('#picker-admission-status');
  let admittedSlugs = new Set();
  let resultsReady = false;
  let selectedRegionName = '';

  const updatePickerAdmissions = () => {
    admissionStatus.hidden = true;
    if (!resultsReady || !admittedSlugs.size) return;
    const visible = pickerCards.filter(card => card.dataset.pickerVisible === 'true');
    const admitted = visible.filter(card => admittedSlugs.has(card.dataset.cultivarSlug));
    if (!admitted.length) return;
    admissionStatus.textContent = `Госреестр: ${admitted.length} из ${visible.length} сортов с допуском для региона «${selectedRegionName}».`;
    admissionStatus.hidden = false;
    for (const heading of pickerResults.querySelectorAll('.picker-group-heading')) {
      const cards = [];
      for (let sibling = heading.nextElementSibling; sibling && sibling.classList.contains('variety-card'); sibling = sibling.nextElementSibling) {
        if (sibling.dataset.pickerVisible === 'true') cards.push(sibling);
      }
      cards.sort((left, right) => Number(admittedSlugs.has(right.dataset.cultivarSlug)) - Number(admittedSlugs.has(left.dataset.cultivarSlug)));
      heading.after(...cards);
    }
  };

  document.querySelector('#picker-output').addEventListener('picker:results', () => {
    resultsReady = true;
    updatePickerAdmissions();
  });

  const clearCardAdmissions = () => {
    admittedSlugs = new Set();
    admissionStatus.hidden = true;
    for (const card of pickerCards) {
      const badge = card.querySelector('.picker-admission');
      badge.replaceChildren();
      badge.hidden = true;
    }
  };

  form.addEventListener('picker:location-change', () => {
    requestId += 1;
    resultsReady = false;
    selectedRegionName = '';
    clearCardAdmissions();
    showStatus('Выберите регион и нажмите «Показать сорта».');
  });

  const showCardAdmission = (cultivar, admission, region) => {
    const card = pickerCards.find(item => item.dataset.cultivarSlug === cultivar.slug);
    if (!card) return;
    const badge = card.querySelector('.picker-admission');
    const heading = document.createElement('strong');
    heading.textContent = 'Есть официальный допуск';
    const explanation = document.createElement('p');
    explanation.textContent = `${region.admission_region_name} регион (${region.admission_region_number}), реестр на ${admission.edition_as_of}.`;
    const source = document.createElement('a');
    source.href = `${admission.source_url}${admission.source_pdf_page ? `#page=${admission.source_pdf_page}` : ''}`;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.textContent = 'Строка Госреестра ↗';
    badge.append(heading, explanation, source);
    badge.hidden = false;
  };

  const showStatus = (message, clearResults = true) => {
    status.textContent = message;
    if (clearResults) results.replaceChildren();
  };

  const loadCatalog = async () => {
    const response = await fetch(`${base}/data/catalog.json`);
    if (!response.ok) throw new Error('catalog fetch failed');
    const text = await response.text();
    const catalog = JSON.parse(text);
    if (catalog.schema_version !== 1 || !Array.isArray(catalog.regions)) {
      throw new Error('catalog schema is unavailable');
    }
    return { text, catalog };
  };

  const normalized = value => value.trim().toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ');
  const recordWord = count => {
    const lastTwo = count % 100;
    if (lastTwo >= 11 && lastTwo <= 14) return 'записей';
    const last = count % 10;
    if (last === 1) return 'запись';
    if (last >= 2 && last <= 4) return 'записи';
    return 'записей';
  };

  const cultivarHref = slug => {
    const url = new URL(`${base}/sorta/${encodeURIComponent(slug)}/`, location.origin);
    const region = form.dataset.activeRegion || String(form.elements.region.value || '').trim();
    const city = form.dataset.activeCity || '';
    if (region) url.searchParams.set('region', region);
    if (city) url.searchParams.set('city', city);
    return `${url.pathname}${url.search}#gosreestr`;
  };

  const showAdmissions = (catalog, region, crop) => {
    if (!region.admission_region_number) return { mapped: false, count: 0 };
    const admitted = catalog.cultivars.filter(item =>
      (crop === 'all' || item.crop_slug === crop) &&
      item.admissions?.some(entry => entry.admission_region_number === region.admission_region_number)
    );
    if (!admitted.length) return { mapped: true, count: 0 };
    admittedSlugs = new Set(admitted.map(cultivar => cultivar.slug));
    for (const cultivar of admitted) {
      const admission = cultivar.admissions.find(entry => entry.admission_region_number === region.admission_region_number);
      showCardAdmission(cultivar, admission, region);
      const item = document.createElement('li');
      item.className = 'admission-result';
      const heading = document.createElement('h3');
      heading.textContent = `${cultivar.canonical_name} · допуск в Госреестре`;
      const explanation = document.createElement('p');
      explanation.textContent = `${region.admission_region_name} регион (${region.admission_region_number}), издание на ${admission.edition_as_of}, запись ${admission.registry_entry_code}.`;
      const cultivarLink = document.createElement('a');
      cultivarLink.href = cultivarHref(cultivar.slug);
      cultivarLink.textContent = 'Карточка сорта и источник ↗';
      item.append(heading, explanation, cultivarLink);
      results.append(item);
    }
    updatePickerAdmissions();
    return { mapped: true, count: admitted.length };
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const currentRequest = ++requestId;
    resultsReady = false;
    clearCardAdmissions();
    const fields = new FormData(form);
    const regionName = String(fields.get('region') || '').trim();
    selectedRegionName = regionName;
    if (!regionName) return;
    const crop = String(fields.get('crop') || 'all');
    showStatus(`Проверяем региональные данные для «${regionName}»…`);

    try {
      catalogPromise ||= loadCatalog();
      const { text, catalog } = await catalogPromise;
      if (currentRequest !== requestId) return;
      const region = catalog.regions.find(item => normalized(item.name_ru || '') === normalized(regionName));
      if (!region) {
        showStatus('Регион не найден в справочнике.');
        return;
      }
      if (!engine) {
        const module = await import(`${base}/assets/selector/malina_selector.js`);
        await module.default();
        engine = module.select_varieties;
      }
      if (currentRequest !== requestId) return;
      const query = { region_code: region.code };
      if (crop !== 'all') query.crop_slug = crop;
      const selection = JSON.parse(engine(text, JSON.stringify(query)));
      if (selection.error) throw new Error(selection.error.message);
      if (selection.total === 0) {
        const admissions = showAdmissions(catalog, region, crop);
        const statusMessage = !admissions.mapped
          ? 'Регион не сопоставлен с районированием Госреестра.'
          : admissions.count
          ? `В Госреестре: ${admissions.count} ${recordWord(admissions.count)} о допуске сортов.`
            : 'В Госреестре нет записей для выбранной культуры и региона.';
        showStatus(statusMessage, false);
        return;
      }
      status.textContent = `${selection.total} ${selection.total === 1 ? 'сорт с проверенным региональным правилом' : 'сорта с проверенными региональными правилами'} для региона «${regionName}».`;
      results.replaceChildren();
      for (const match of selection.matches) {
        const item = document.createElement('li');
        const heading = document.createElement('h3');
        heading.textContent = match.canonical_name;
        const cultivarLink = document.createElement('a');
        cultivarLink.href = cultivarHref(match.slug);
        cultivarLink.textContent = 'Карточка сорта и источники ↗';
        item.append(heading, cultivarLink);
        for (const reason of match.reasons) {
          const rationale = document.createElement('p');
          rationale.textContent = reason.rationale;
          const limits = document.createElement('p');
          limits.textContent = `Условия применения: ${reason.limitations}`;
          const basis = document.createElement('p');
          basis.textContent = `${reason.basis_kind === 'regional_trial' ? 'Региональное испытание' : 'Местное наблюдение'}: ${reason.basis_place}. Условия: ${reason.basis_conditions}. Детали наблюдения: ${reason.basis_limitations}.`;
          const source = document.createElement('small');
          source.append('Основание: ');
          if (reason.basis_source_url?.startsWith('https://')) {
            const link = document.createElement('a');
            link.href = reason.basis_source_url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = reason.basis_source_title;
            source.append(link);
          } else {
            source.append(reason.basis_source_title);
          }
          source.append(` · ${reason.basis_source_locator}`);
          item.append(rationale, limits, basis, source);
        }
        results.append(item);
      }
      showAdmissions(catalog, region, crop);
    } catch {
      if (currentRequest !== requestId) return;
      catalogPromise = undefined;
      showStatus('Не удалось загрузить данные Госреестра. Попробуйте позже.');
    }
  });
}
