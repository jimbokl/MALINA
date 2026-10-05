import { getRegionalTrials } from './regional-trials.mjs';

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
  const trialSection = document.querySelector('#regional-trials');
  const trialCards = document.querySelector('#regional-trial-cards');
  const trialSources = document.querySelector('#regional-trial-sources');
  const trialJump = document.querySelector('#picker-trial-jump');

  const clearTrials = () => {
    if (trialSection) trialSection.hidden = true;
    if (trialJump) trialJump.hidden = true;
    trialCards?.replaceChildren();
    trialSources?.replaceChildren();
    for (const card of pickerCards) {
      const note = card.querySelector('.picker-trial');
      if (note) { note.replaceChildren(); note.hidden = true; }
    }
  };

  const updatePickerAdmissions = () => {
    admissionStatus.hidden = true;
    if (!resultsReady || !admittedSlugs.size) return;
    const visible = pickerCards.filter(card => card.dataset.pickerVisible === 'true');
    const admitted = visible.filter(card => admittedSlugs.has(card.dataset.cultivarSlug));
    if (!admitted.length) return;
    admissionStatus.textContent = `Мы нашли ${admitted.length} ${varietyWord(admitted.length)} в региональном списке. Показываем их первыми — начните сравнение с них.`;
    admissionStatus.hidden = false;
    for (const heading of pickerResults.querySelectorAll('.picker-group-heading')) {
      const cards = [];
      for (let sibling = heading.nextElementSibling; sibling && sibling.classList.contains('variety-card'); sibling = sibling.nextElementSibling) {
        if (sibling.dataset.pickerVisible === 'true') cards.push(sibling);
      }
      cards.sort((left, right) => Number(admittedSlugs.has(right.dataset.cultivarSlug)) - Number(admittedSlugs.has(left.dataset.cultivarSlug)));
      heading.after(...cards);
    }
    document.querySelector('#picker-output').dispatchEvent(new Event('picker:order-change'));
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
    clearTrials();
    showStatus('Выберите регион и нажмите «Показать сорта».');
  });

  const showCardAdmission = (cultivar, admission, region) => {
    const card = pickerCards.find(item => item.dataset.cultivarSlug === cultivar.slug);
    if (!card) return;
    const badge = card.querySelector('.picker-admission');
    const heading = document.createElement('strong');
    heading.textContent = 'В региональном списке';
    const explanation = document.createElement('p');
    explanation.textContent = selectedRegionName || region.name_ru;
    badge.replaceChildren(heading, explanation);
    badge.hidden = false;
  };

  const showStatus = (message, clearResults = true, outcome = '') => {
    status.dataset.outcome = outcome;
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
  const varietyWord = count => count % 100 >= 11 && count % 100 <= 14
    ? 'сортов'
    : count % 10 === 1 ? 'сорт' : count % 10 >= 2 && count % 10 <= 4 ? 'сорта' : 'сортов';
  const cultivarHref = slug => {
    const url = new URL(`${base}/sorta/${encodeURIComponent(slug)}/`, location.origin);
    const region = form.dataset.activeRegion || String(form.elements.region.value || '').trim();
    const city = form.dataset.activeCity || '';
    if (region) url.searchParams.set('region', region);
    if (city) url.searchParams.set('city', city);
    return `${url.pathname}${url.search}`;
  };

  const showTrials = (catalog, region, crop) => {
    const trials = getRegionalTrials(catalog, region.code, crop);
    if (!trialSection || !trials.length) return;
    const sourceList = document.createElement('div');
    sourceList.className = 'regional-trial-evidence';
    for (const trial of trials) {
      const finding = trial.findings[0];
      const note = pickerCards.find(card => card.dataset.cultivarSlug === trial.slug)?.querySelector('.picker-trial');
      if (note) {
        const heading = document.createElement('strong');
        heading.textContent = 'Изучали в вашем регионе';
        const metric = document.createElement('p');
        metric.textContent = `${finding.label}: ${finding.value} · ${finding.period}`;
        note.replaceChildren(heading, metric);
        note.hidden = false;
      }
      const card = document.createElement('article');
      card.className = 'regional-trial-card';
      const cropLabel = document.createElement('span');
      cropLabel.className = 'eyebrow';
      cropLabel.textContent = trial.cropSlug === 'raspberry' ? 'МАЛИНА' : 'КЛУБНИКА';
      const title = document.createElement('h3');
      title.textContent = trial.name;
      const period = document.createElement('p');
      period.className = 'regional-trial-place';
      period.textContent = `${finding.period} · ${finding.placeLabel}`;
      const facts = document.createElement('ul');
      for (const fact of trial.findings.filter(item => item.sourceKey === finding.sourceKey)) {
        const item = document.createElement('li');
        item.textContent = `${fact.label}: ${fact.value}`;
        facts.append(item);
      }
      const links = document.createElement('div');
      links.className = 'regional-trial-links';
      const varietyLink = document.createElement('a');
      varietyLink.href = cultivarHref(trial.slug);
      varietyLink.textContent = 'Посмотреть сорт →';
      const reviewsLink = document.createElement('a');
      reviewsLink.href = `${cultivarHref(trial.slug)}#otzyvy`;
      reviewsLink.textContent = 'Опыт садоводов →';
      links.append(varietyLink, reviewsLink);
      card.append(cropLabel, title, period, facts, links);
      trialCards.append(card);

      const evidence = document.createElement('article');
      const evidenceTitle = document.createElement('h3');
      evidenceTitle.textContent = trial.name;
      evidence.append(evidenceTitle);
      for (const fact of trial.findings) {
        const description = document.createElement('p');
        description.textContent = `${fact.label}: ${fact.value}. ${fact.period}. ${fact.place}. ${fact.conditions}. ${fact.method}`;
        evidence.append(description);
        if (fact.uncertainty) {
          const details = document.createElement('p');
          details.textContent = fact.uncertainty;
          evidence.append(details);
        }
        const sourceLink = document.createElement('a');
        sourceLink.href = fact.sourceUrl;
        sourceLink.target = '_blank';
        sourceLink.rel = 'noopener noreferrer';
        sourceLink.textContent = `${fact.sourceTitle} · ${fact.sourceLocator} ↗`;
        evidence.append(sourceLink);
      }
      sourceList.append(evidence);
    }
    const summary = document.createElement('summary');
    summary.textContent = 'Источники и условия испытаний';
    trialSources.replaceChildren(summary, sourceList);
    trialSection.hidden = false;
    if (trialJump) trialJump.hidden = false;
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
      heading.textContent = cultivar.canonical_name;
      const explanation = document.createElement('p');
      explanation.textContent = 'Посмотрите, чем он отличается от других сортов, и почитайте опыт садоводов.';
      const cultivarLink = document.createElement('a');
      cultivarLink.href = cultivarHref(cultivar.slug);
      cultivarLink.textContent = 'Открыть сорт ↗';
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
    clearTrials();
    const fields = new FormData(form);
    const regionName = String(fields.get('region') || '').trim();
    selectedRegionName = regionName;
    if (!regionName) return;
    const crop = String(fields.get('crop') || 'all');
    showStatus(`Подбираем сорта для «${regionName}»…`);
    let admissionFallback;

    try {
      catalogPromise ||= loadCatalog();
      const { text, catalog } = await catalogPromise;
      if (currentRequest !== requestId) return;
      const region = catalog.regions.find(item => normalized(item.name_ru || '') === normalized(regionName));
      if (!region) {
        showStatus('Выберите регион из списка и попробуйте ещё раз.', true, 'unknown_region');
        return;
      }
      admissionFallback = showAdmissions(catalog, region, crop);
      showTrials(catalog, region, crop);
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
        const admissions = admissionFallback;
        const statusMessage = !admissions.mapped
          ? 'Для этого региона пока нет отдельного списка сортов. Попробуйте соседний регион или общий каталог.'
          : admissions.count
          ? `Мы нашли ${admissions.count} ${varietyWord(admissions.count)} в региональном списке. Откройте карточки и сравните сорта.`
            : 'Для выбранной культуры в этом регионе пока нет записей. Посмотрите общий каталог сортов.';
        showStatus(statusMessage, false, admissions.count ? 'verified_rule' : admissions.mapped ? 'no_verified_rule' : 'unmapped_region');
        return;
      }
      status.dataset.outcome = 'verified_rule';
      status.textContent = `Мы нашли ${selection.total} ${varietyWord(selection.total)} с наблюдениями для «${regionName}».`;
      results.replaceChildren();
      for (const match of selection.matches) {
        const item = document.createElement('li');
        const heading = document.createElement('h3');
        heading.textContent = match.canonical_name;
        const cultivarLink = document.createElement('a');
        cultivarLink.href = cultivarHref(match.slug);
        cultivarLink.textContent = 'Открыть сорт ↗';
        item.append(heading, cultivarLink);
        for (const reason of match.reasons) {
          const rationale = document.createElement('p');
          rationale.textContent = reason.rationale;
          item.append(rationale);
          if (reason.limitations) {
            const limits = document.createElement('details');
            const summary = document.createElement('summary');
            summary.textContent = 'Условия наблюдения';
            const explanation = document.createElement('p');
            explanation.textContent = reason.limitations;
            limits.append(summary, explanation);
            item.append(limits);
          }
        }
        results.append(item);
      }
      showAdmissions(catalog, region, crop);
    } catch {
      if (currentRequest !== requestId) return;
      if (admissionFallback?.count) {
        showStatus(`Мы нашли ${admissionFallback.count} ${varietyWord(admissionFallback.count)} в региональном списке. Откройте карточки и сравните сорта.`, false, 'verified_rule');
        return;
      }
      catalogPromise = undefined;
      showStatus('Не получилось загрузить сорта. Попробуйте ещё раз.', true, 'load_error');
    }
  });
}
