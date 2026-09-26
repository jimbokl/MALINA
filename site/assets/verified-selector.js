const form = document.querySelector('#picker-form');

if (form) {
  const base = document.documentElement.dataset.siteBase || '';
  const status = document.querySelector('#verified-status');
  const results = document.querySelector('#verified-results');
  let catalogPromise;
  let engine;
  let requestId = 0;
  const pickerCards = [...document.querySelectorAll('#picker-results .variety-card[data-cultivar-slug]')];

  const clearCardAdmissions = () => {
    for (const card of pickerCards) {
      const badge = card.querySelector('.picker-admission');
      badge.replaceChildren();
      badge.hidden = true;
    }
  };

  const showCardAdmission = (cultivar, admission, region) => {
    const card = pickerCards.find(item => item.dataset.cultivarSlug === cultivar.slug);
    if (!card) return;
    const badge = card.querySelector('.picker-admission');
    const heading = document.createElement('strong');
    heading.textContent = 'Есть официальный допуск';
    const explanation = document.createElement('p');
    explanation.textContent = `${region.admission_region_name} регион (${region.admission_region_number}), реестр на ${admission.edition_as_of}. Это не прогноз зимовки или урожайности на вашем участке.`;
    const source = document.createElement('a');
    source.href = `${admission.source_url}${admission.source_pdf_page ? `#page=${admission.source_pdf_page}` : ''}`;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.textContent = 'Строка Госреестра ↗';
    badge.append(heading, explanation, source);
    badge.hidden = false;
  };

  const showStatus = message => {
    status.textContent = message;
    results.replaceChildren();
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

  const showAdmissions = (catalog, region, crop) => {
    if (!region.admission_region_number) return;
    const admitted = catalog.cultivars.filter(item =>
      (crop === 'all' || item.crop_slug === crop) &&
      item.admissions?.some(entry => entry.admission_region_number === region.admission_region_number)
    );
    if (!admitted.length) return;
    for (const cultivar of admitted) {
      const admission = cultivar.admissions.find(entry => entry.admission_region_number === region.admission_region_number);
      showCardAdmission(cultivar, admission, region);
      const item = document.createElement('li');
      item.className = 'admission-result';
      const heading = document.createElement('h3');
      heading.textContent = `${cultivar.canonical_name} · допуск в Госреестре`;
      const explanation = document.createElement('p');
      explanation.textContent = `${region.admission_region_name} регион (${region.admission_region_number}), издание на ${admission.edition_as_of}, запись ${admission.registry_entry_code}. Допуск не гарантирует зимовку и урожайность на конкретном участке.`;
      const cultivarLink = document.createElement('a');
      cultivarLink.href = `${base}/sorta/${encodeURIComponent(cultivar.slug)}/#gosreestr`;
      cultivarLink.textContent = 'Карточка сорта и источник ↗';
      item.append(heading, explanation, cultivarLink);
      results.append(item);
    }
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const currentRequest = ++requestId;
    clearCardAdmissions();
    const fields = new FormData(form);
    const regionName = String(fields.get('region') || '').trim();
    if (!regionName) return;
    const crop = String(fields.get('crop') || 'all');
    showStatus(`Проверяем опубликованные правила для региона «${regionName}»…`);

    try {
      catalogPromise ||= loadCatalog();
      const { text, catalog } = await catalogPromise;
      if (currentRequest !== requestId) return;
      const region = catalog.regions.find(item => normalized(item.name_ru || '') === normalized(regionName));
      if (!region) {
        showStatus(`Для региона «${regionName}» пока нет проверенных рекомендаций. Сорта выше — справочное сравнение по признакам, а не региональный вывод.`);
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
        showStatus(`Для региона «${regionName}» пока нет проверенных рекомендаций по местным испытаниям. Ниже — отдельные факты об официальном допуске, если они есть.`);
        showAdmissions(catalog, region, crop);
        return;
      }
      status.textContent = `${selection.total} ${selection.total === 1 ? 'сорт с проверенным региональным правилом' : 'сорта с проверенными региональными правилами'} для региона «${regionName}». Читайте основания и ограничения каждого правила.`;
      results.replaceChildren();
      for (const match of selection.matches) {
        const item = document.createElement('li');
        const heading = document.createElement('h3');
        heading.textContent = match.canonical_name;
        item.append(heading);
        for (const reason of match.reasons) {
          const rationale = document.createElement('p');
          rationale.textContent = reason.rationale;
          const limits = document.createElement('p');
          limits.textContent = `Ограничения: ${reason.limitations}`;
          const basis = document.createElement('p');
          basis.textContent = `${reason.basis_kind === 'regional_trial' ? 'Региональное испытание' : 'Местное наблюдение'}: ${reason.basis_place}. Условия: ${reason.basis_conditions}. Ограничения наблюдения: ${reason.basis_limitations}.`;
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
      showStatus('Не удалось проверить региональные рекомендации. Попробуйте обновить страницу позже; справочный каталог доступен отдельно.');
    }
  });
}
