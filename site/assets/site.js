const menuButton = document.querySelector('.menu-toggle');
// Goals are inert until a real Yandex Metrica counter is configured in the page.
const ymCounter = Number(document.documentElement.dataset.ymCounter || 0);
const analyticsEnabled = Number.isSafeInteger(ymCounter) && ymCounter > 0;
const pagePath = location.pathname;
const siteBase = document.documentElement.dataset.siteBase || '';
const routePath = siteBase && pagePath.startsWith(`${siteBase}/`) ? pagePath.slice(siteBase.length) : pagePath;
const cultivarPath = /^\/sorta\/([a-z0-9-]+)\/$/.exec(routePath);
const pageType = /^\/podbor\/(?:[a-z0-9-]+\/)?$/.test(routePath) ? 'selector'
  : /^\/sravnenie\/(malina|klubnika)\/$/.test(routePath) ? 'comparison'
    : cultivarPath ? 'cultivar' : 'other';
const pageCrop = routePath === '/sravnenie/malina/' ? 'raspberry'
  : routePath === '/sravnenie/klubnika/' ? 'strawberry' : undefined;
const cropValue = value => ['raspberry', 'strawberry', 'all'].includes(value) ? value : 'unknown';
const safeId = value => /^[a-z0-9-]{1,80}$/.test(value || '') ? value : undefined;
// Form values, query strings, fragments, referrers, error messages and stacks never enter goals.
const cleanReferrer = (() => {
  try {
    const referrer = new URL(document.referrer);
    return referrer.origin === location.origin ? `${referrer.origin}${referrer.pathname}` : referrer.origin;
  } catch { return location.origin + '/'; }
})();
if (analyticsEnabled) {
  window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
  const metrika = document.createElement('script');
  metrika.async = true;
  metrika.src = 'https://mc.yandex.ru/metrika/tag.js';
  document.head.append(metrika);
  window.ym(ymCounter, 'init', { defer: true, clickmap: false, webvisor: false, trackLinks: false, sendTitle: false });
  window.ym(ymCounter, 'hit', pagePath, { referer: cleanReferrer });
}
function trackGoal(goal, params = {}) {
  if (analyticsEnabled && typeof window.ym === 'function') {
    window.ym(ymCounter, 'reachGoal', goal, { page_type: pageType, ...params });
  }
}
if (cultivarPath) {
  const crop = document.querySelector('.variety-hero-art.raspberry') ? 'raspberry'
    : document.querySelector('.variety-hero-art.strawberry') ? 'strawberry' : 'unknown';
  trackGoal('cultivar_view', { crop, cultivar: cultivarPath[1] });
  const pickerLink = document.querySelector('#variety-picker-link');
  const reviewsNextLink = document.querySelector('#reviews-next-link');
  const params = new URLSearchParams(location.search);
  const city = params.get('city')?.trim();
  const region = params.get('region')?.trim();
  if (pickerLink && city) {
    fetch(`${siteBase}/data/cities.json`).then(response => {
      if (!response.ok) throw new Error('city routes unavailable');
      return response.json();
    }).then(cities => {
      if (!Array.isArray(cities)) return;
      const normalize = value => String(value || '').trim().toLocaleLowerCase('ru-RU').replace(/ё/g, 'е');
      const matches = cities.filter(item => normalize(item.name) === normalize(city) &&
        (!region || normalize(item.region) === normalize(region)));
      if (matches.length === 1 && safeId(matches[0].slug)) {
        const cityPickerPath = `${siteBase}/podbor/${matches[0].slug}/`;
        pickerLink.href = cityPickerPath;
        if (reviewsNextLink) reviewsNextLink.href = cityPickerPath;
      }
    }).catch(() => {});
  }
}
window.addEventListener('error', event => {
  let source;
  try { source = new URL(event.filename); } catch { return; }
  if (source.origin !== location.origin || !source.pathname.includes('/assets/')) return;
  const component = source.pathname.includes('/selector/') ? 'selector'
    : source.pathname.endsWith('/assets/site.js') ? 'site' : 'other';
  trackGoal('site_technical_error', { component, error_type: 'script' });
});
window.addEventListener('unhandledrejection', () => {
  trackGoal('site_technical_error', { component: pageType, error_type: 'promise' });
});

document.addEventListener('click', async event => {
  const cultivarLink = event.target.closest('[data-article-to-cultivar]');
  if (cultivarLink) trackGoal('article_to_cultivar', {
    article: safeId(cultivarLink.dataset.articleToCultivar),
    cultivar: safeId(/\/sorta\/([a-z0-9-]+)\//.exec(cultivarLink.getAttribute('href') || '')?.[1])
  });
  const offerLink = event.target.closest('[data-affiliate-offer]');
  if (offerLink) trackGoal('affiliate_click', {
    offer_id: safeId(offerLink.dataset.affiliateOffer), cultivar: safeId(offerLink.dataset.cultivar)
  });

  const comparisonLink = event.target.closest('#picker-compare-link');
  if (comparisonLink && !comparisonLink.hidden) trackGoal('comparison_open', {
    crop: cropValue(document.querySelector('#picker-form')?.elements?.crop?.value)
  });
  const comparisonCultivar = event.target.closest('#comparison a[href*="/sorta/"]');
  if (comparisonCultivar) trackGoal('comparison_to_cultivar', {
    crop: pageCrop, cultivar: safeId(/\/sorta\/([a-z0-9-]+)\//.exec(comparisonCultivar.getAttribute('href') || '')?.[1])
  });
  if (event.target.closest('#picker-memo-print') && !document.querySelector('#picker-memo')?.hidden) {
    trackGoal('memo_print_requested', { crop: cropValue(document.querySelector('#picker-form')?.elements?.crop?.value) });
  }

  const shareButton = event.target.closest('[data-share-article]');
  if (!shareButton) return;
  const article = shareButton.closest('.media-article');
  if (!article) return;
  const title = article.querySelector('h1')?.textContent.trim() || document.title;
  const teaser = article.querySelector('.media-share-summary')?.textContent.trim() || '';
  const url = document.querySelector('link[rel="canonical"]')?.href || location.href;
  const status = article.querySelector('.media-share-status');
  const kind = shareButton.dataset.shareArticle;
  if (kind === 'copy') {
    try {
      await navigator.clipboard.writeText(`${title}\n\n${teaser}\n\n${url}`);
      if (status) status.textContent = 'Анонс и ссылка скопированы.';
    } catch {
      if (status) status.textContent = 'Не удалось скопировать. Скопируйте адрес страницы из браузера.';
    }
    return;
  }
  const hero = article.querySelector('.media-hero-image img');
  const imageUrl = hero ? new URL(hero.getAttribute('src'), location.origin).href : '';
  const target = kind === 'vk'
    ? `https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(teaser)}`
    : kind === 'pinterest' && imageUrl
      ? `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(`${title}. ${teaser}`)}`
      : null;
  if (target) window.open(target, '_blank', 'noopener,noreferrer,width=780,height=650');
});
document.addEventListener('change', event => {
  const input = event.target;
  if (!input?.matches?.('.picker-compare-checkbox, #comparison input[name="cultivar"]') || !input.checked) return;
  const crop = input.closest('.variety-card')?.dataset.crop || document.querySelector('#comparison')?.dataset.crop;
  trackGoal('comparison_add', { crop: cropValue(crop), source: pageType });
});
const mobileNav = document.querySelector('#mobile-nav');
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  mobileNav.hidden = !open;
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || menuButton?.getAttribute('aria-expanded') !== 'true') return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
  mobileNav.hidden = true;
  menuButton.focus();
});

const catalogForm = document.querySelector('#catalog-form');
if (catalogForm) {
  const cards = [...document.querySelectorAll('#catalog-results .variety-card')];
  const count = document.querySelector('#catalog-count');
  const empty = document.querySelector('#catalog-empty');
  const results = document.querySelector('#catalog-results');
  const viewButtons = [...document.querySelectorAll('[data-catalog-view]')];
  for (const button of viewButtons) {
    button.addEventListener('click', () => {
      const view = button.dataset.catalogView;
      results.dataset.view = view;
      for (const control of viewButtons) control.setAttribute('aria-pressed', String(control === button));
    });
  }
  const catalogParams = new URLSearchParams(location.search);
  const requestedFruiting = catalogParams.get('fruiting');
  if (['remontant', 'summer'].includes(requestedFruiting)) catalogForm.elements.fruiting.value = requestedFruiting;
  if (['raspberry', 'strawberry'].includes(catalogParams.get('crop'))) catalogForm.elements.crop.value = catalogParams.get('crop');
  if (['red', 'yellow', 'unknown'].includes(catalogParams.get('fruitColor'))) catalogForm.elements.fruitColor.value = catalogParams.get('fruitColor');
  const filter = () => {
    const data = new FormData(catalogForm);
    const crop = data.get('crop'); const setting = data.get('setting'); const fruiting = data.get('fruiting'); const fruitColor = data.get('fruitColor');
    const query = String(data.get('query') || '').trim().toLocaleLowerCase('ru');
    const visibleCards = [];
    for (const card of cards) {
      const show = (crop === 'all' || card.dataset.crop === crop) && (setting === 'all' || card.dataset.setting === setting) && (fruiting === 'all' || card.dataset.fruiting === fruiting) && (fruitColor === 'all' || card.dataset.fruitColor === fruitColor) && card.dataset.name.includes(query);
      card.hidden = !show;
      if (show) visibleCards.push(card);
    }
    const visible = visibleCards.length;
    const total = String(visible).padStart(2, '0');
    for (const [index, card] of visibleCards.entries()) {
      const number = card.querySelector('.variety-number');
      if (number) number.textContent = `${String(index + 1).padStart(2, '0')} / ${total}`;
    }
    count.textContent = `${visible} ${visible === 1 ? 'сорт' : visible > 1 && visible < 5 ? 'сорта' : 'сортов'} для сравнения`;
    empty.hidden = visible !== 0;
  };
  catalogForm.addEventListener('input', filter);
  catalogForm.addEventListener('change', filter);
  filter();
}

const pickerForm = document.querySelector('#picker-form');
if (pickerForm) {
  const pickerCropValue = value => ['raspberry', 'strawberry', 'all'].includes(value) ? value : 'unknown';
  let selectorStarted = false;
  let lastRuleOutcome = '';
  const startSelector = () => {
    if (selectorStarted) return;
    selectorStarted = true;
    trackGoal('selector_start', { crop: pickerCropValue(pickerForm.elements?.crop?.value) });
  };
  pickerForm.addEventListener('focusin', startSelector);
  pickerForm.addEventListener('submit', () => {
    startSelector();
    lastRuleOutcome = '';
  }, true);
  const ruleStatus = document.querySelector('#verified-status');
  if (ruleStatus && typeof MutationObserver !== 'undefined') {
    new MutationObserver(() => {
      const message = ruleStatus.textContent;
      const outcome = message === 'Регион не сопоставлен с районированием Госреестра.' ? 'unmapped_region'
        : message.startsWith('В Госреестре:') || message.startsWith('В Госреестре нет записей') ? 'no_verified_rule'
          : message === 'Регион не найден в справочнике.' ? 'unknown_region'
            : message === 'Не удалось загрузить данные Госреестра. Попробуйте позже.' ? 'load_error' : '';
      if (!outcome || outcome === lastRuleOutcome) return;
      lastRuleOutcome = outcome;
      trackGoal(outcome === 'load_error' ? 'selector_error' : 'selector_no_region_data', {
        crop: pickerCropValue(pickerForm.elements?.crop?.value), result: outcome
      });
    }).observe(ruleStatus, { childList: true, characterData: true, subtree: true });
  }
  (async () => {
  const params = new URLSearchParams(location.search);
  const city = (pickerForm.dataset.city || params.get('city') || '').trim();
  const cityRegion = (pickerForm.dataset.region || params.get('region') || '').trim();
  const regionInput = pickerForm.querySelector('#picker-region');
  const cityContext = pickerForm.querySelector('#picker-city-context');
  const placeError = pickerForm.querySelector('#picker-place-error');
  const placeContinue = pickerForm.querySelector('#picker-place-continue');
  let allowUnknownPlace = false;
  const places = [...pickerForm.querySelectorAll('#picker-places option')].map(option => ({
    name: option.value,
    region: option.dataset.region,
    city: option.dataset.city
  }));
  const normalizeRegion = value => value.trim().toLocaleLowerCase('ru-RU').replace(/ё/g, 'е');
  let currentCity = city;
  let currentCityRegion = cityRegion;
  const clearPickerLocationResults = () => {
    const output = document.querySelector('#picker-output');
    output.hidden = true;
    const memo = document.querySelector('#picker-memo');
    if (memo) memo.hidden = true;
    for (const checkbox of output.querySelectorAll('.picker-compare-checkbox')) checkbox.checked = false;
    delete pickerForm.dataset.activeCity;
    delete pickerForm.dataset.activeRegion;
    pickerForm.dispatchEvent(new Event('picker:location-change'));
  };
  const invalidatePickerLocation = () => {
    allowUnknownPlace = false;
    delete pickerForm.dataset.allowUnknownPlace;
    clearPickerLocationResults();
  };
  // Invalidate stale city results synchronously, even while the place module loads.
  regionInput.addEventListener('input', invalidatePickerLocation);
  regionInput.addEventListener('change', invalidatePickerLocation);
  const { resolvePickerPlace, normalizePickerPlace } = await import('./picker-place.mjs');
  if (cityRegion) regionInput.value = cityRegion;
  const updateCityContext = () => {
    placeError.hidden = true;
    placeContinue.hidden = true;
    const selected = resolvePickerPlace(regionInput.value, places);
    const activeCity = selected?.city || (normalizeRegion(regionInput.value) === normalizeRegion(currentCityRegion) ? currentCity : '');
    cityContext.hidden = !activeCity;
    if (activeCity) cityContext.textContent = `Город: ${activeCity}. Выберите культуру и посмотрите сорта.`;
  };
  const handlePickerLocationChange = () => {
    updateCityContext();
  };
  regionInput.addEventListener('input', handlePickerLocationChange);
  regionInput.addEventListener('change', handlePickerLocationChange);
  placeContinue.addEventListener('click', () => {
    allowUnknownPlace = true;
    pickerForm.dataset.allowUnknownPlace = 'true';
    pickerForm.requestSubmit();
  });
  updateCityContext();
  pickerForm.addEventListener('submit', async event => {
    event.preventDefault();
    const selectedPlace = resolvePickerPlace(regionInput.value, places);
    if (!selectedPlace && !allowUnknownPlace) {
      event.stopImmediatePropagation();
      placeError.hidden = false;
      placeContinue.hidden = false;
      clearPickerLocationResults();
      document.querySelector('#verified-status').textContent = 'Выберите город или регион из списка выше.';
      document.querySelector('#verified-results').replaceChildren();
      regionInput.focus();
      return;
    }
    currentCity = selectedPlace ? selectedPlace.city || (normalizePickerPlace(selectedPlace.region) === normalizePickerPlace(currentCityRegion) ? currentCity : '') : '';
    currentCityRegion = selectedPlace?.region || regionInput.value.trim();
    if (selectedPlace) regionInput.value = selectedPlace.region;
    updateCityContext();
    const { classifyPickerCard, cityForPickerContext, describePickerCardReason } = await import('./picker-filter.mjs');
    const data = new FormData(pickerForm);
    const region = String(data.get('region') || '').trim();
    if (!region) { regionInput.focus(); return; }
    const crop = data.get('crop');
    const setting = data.get('setting');
    const light = data.get('light');
    const fruiting = data.get('fruiting');
    const harvestTiming = data.get('harvestTiming');
    const shelter = data.get('shelter');
    const drainage = data.get('drainage');
    const output = document.querySelector('#picker-output');
    const cards = [...document.querySelectorAll('#picker-results .variety-card')];
    const activeCity = cityForPickerContext(currentCity, currentCityRegion, region);
    pickerForm.dataset.activeCity = activeCity;
    pickerForm.dataset.activeRegion = region;
    for (const link of output.querySelectorAll('.variety-card a[href]')) {
      const target = new URL(link.href);
      if (target.origin !== location.origin || !/\/sorta\/[a-z0-9-]+\/$/.test(target.pathname)) continue;
      target.searchParams.delete('city');
      target.searchParams.set('region', region);
      if (activeCity) target.searchParams.set('city', activeCity);
      link.href = `${target.pathname}${target.search}${target.hash}`;
    }
    const matches = [];
    const needsEvidence = [];
    const excluded = [];
    for (const card of cards) {
      const result = classifyPickerCard({
        crop: card.dataset.crop,
        light: card.dataset.light,
        setting: card.dataset.setting,
        fruiting: card.dataset.fruiting,
        harvestTiming: card.dataset.harvestTiming
      }, { crop, light, setting, fruiting, harvestTiming });
      card.hidden = result.status === 'exclude';
      card.dataset.pickerVisible = result.status === 'exclude' ? 'false' : 'true';
      if (result.status === 'exclude') { excluded.push(card); continue; }
      if (result.status === 'match') matches.push(card);
      else needsEvidence.push(card);
      const matchPanel = card.querySelector('.picker-match');
      const why = card.querySelector('.picker-match-why');
      if (matchPanel && why) {
        const reason = describePickerCardReason({ light, setting, fruiting, harvestTiming }, result);
        why.textContent = reason;
        matchPanel.hidden = !reason;
      }
    }
    const results = document.querySelector('#picker-results');
    const heading = (label, count) => {
      const node = document.createElement('h3');
      node.className = 'picker-group-heading';
      node.textContent = count == null ? label : `${label} · ${count}`;
      return node;
    };
    const hasConditions = light !== 'unknown' || setting !== 'all' || fruiting !== 'all' || harvestTiming !== 'all';
    results.replaceChildren(
      ...(matches.length ? [heading(hasConditions ? 'По выбранным условиям' : 'Сорта', hasConditions ? matches.length : null), ...matches] : []),
      ...(needsEvidence.length ? [heading('Нужно уточнить данные', needsEvidence.length), ...needsEvidence] : []),
      ...excluded
    );
    const visible = matches.length + needsEvidence.length;
    const noun = visible % 10 === 1 && visible % 100 !== 11 ? 'сорт'
      : visible % 10 >= 2 && visible % 10 <= 4 && (visible % 100 < 12 || visible % 100 > 14) ? 'сорта' : 'сортов';
    const cropName = crop === 'raspberry' ? 'малины' : crop === 'strawberry' ? 'клубники' : 'малины и клубники';
    document.querySelector('#picker-title').textContent = visible ? `${visible} ${noun} ${cropName}` : 'Совпадений нет';
    document.querySelector('#picker-region-status').textContent = `Место: ${activeCity || region}`;
    const openQuestions = [];
    if (shelter === 'yes') openQuestions.push('планируется зимнее укрытие');
    if (shelter === 'no') openQuestions.push('зимнее укрытие не планируется');
    if (drainage === 'wet') openQuestions.push('после дождя вода долго стоит на участке');
    if (drainage === 'drained') openQuestions.push('вода после дождя быстро уходит');
    const conditionsNote = document.querySelector('#picker-conditions');
    conditionsNote.hidden = openQuestions.length === 0;
    conditionsNote.textContent = openQuestions.length ? `Участок: ${openQuestions.join('; ')}` : '';
    document.querySelector('#picker-empty').hidden = visible !== 0;
    output.hidden = false;
    output.dispatchEvent(new Event('picker:results'));
    output.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    output.focus({ preventScroll: true });
    trackGoal('selector_complete', { crop: pickerCropValue(crop), result: visible ? 'results' : 'empty', matches: visible });
  }, true);
  })();
}
