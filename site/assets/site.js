const menuButton = document.querySelector('.menu-toggle');
// Goals are inert until a real Yandex Metrica counter is configured in the page.
const ymCounter = Number(document.documentElement.dataset.ymCounter || 0);
if (Number.isSafeInteger(ymCounter) && ymCounter > 0) {
  window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
  const metrika = document.createElement('script');
  metrika.async = true;
  metrika.src = 'https://mc.yandex.ru/metrika/tag.js';
  document.head.append(metrika);
  window.ym(ymCounter, 'init', { clickmap: false, webvisor: false, trackLinks: false, sendTitle: false });
}
function trackGoal(goal, params = {}) {
  if (Number.isSafeInteger(ymCounter) && ymCounter > 0 && typeof window.ym === 'function') {
    window.ym(ymCounter, 'reachGoal', goal, params);
  }
}

document.addEventListener('click', async event => {
  const cultivarLink = event.target.closest('[data-article-to-cultivar]');
  if (cultivarLink) trackGoal('article_to_cultivar', { article: cultivarLink.dataset.articleToCultivar, cultivar_url: cultivarLink.getAttribute('href') });
  const offerLink = event.target.closest('[data-affiliate-offer]');
  if (offerLink) trackGoal('affiliate_click', { offer_id: offerLink.dataset.affiliateOffer, cultivar: offerLink.dataset.cultivar });

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
    let visible = 0;
    for (const card of cards) {
      const show = (crop === 'all' || card.dataset.crop === crop) && (setting === 'all' || card.dataset.setting === setting) && (fruiting === 'all' || card.dataset.fruiting === fruiting) && (fruitColor === 'all' || card.dataset.fruitColor === fruitColor) && card.dataset.name.includes(query);
      card.hidden = !show;
      if (show) visible++;
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
  const params = new URLSearchParams(location.search);
  const city = (pickerForm.dataset.city || params.get('city') || '').trim();
  const region = (pickerForm.dataset.region || params.get('region') || '').trim();
  const regionInput = pickerForm.querySelector('#picker-region');
  const cityContext = pickerForm.querySelector('#picker-city-context');
  const normalizeRegion = value => value.trim().toLocaleLowerCase('ru-RU').replace(/ё/g, 'е');
  if (region) regionInput.value = region;
  if (city && region && cityContext) {
    cityContext.textContent = `Город: ${city}. Выберите условия участка для сравнения сортов.`;
    const updateCityContext = () => {
      cityContext.hidden = normalizeRegion(regionInput.value) !== normalizeRegion(region);
    };
    regionInput.addEventListener('input', updateCityContext);
    regionInput.addEventListener('change', updateCityContext);
    updateCityContext();
  }
  pickerForm.addEventListener('submit', async event => {
    event.preventDefault();
    const { classifyPickerCard } = await import('./picker-filter.mjs');
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
    const activeCity = city && normalizeRegion(region) === normalizeRegion(regionInput.value) ? city : '';
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
      if (result.status === 'exclude') { excluded.push(card); continue; }
      if (result.status === 'match') matches.push(card);
      else needsEvidence.push(card);
      const why = card.querySelector('.picker-match-why');
      const check = card.querySelector('.picker-match-check');
      if (why && check) {
        const lightFact = card.dataset.light === 'sun' ? 'солнечное место' : 'освещённость не уточнена';
        why.textContent = result.status === 'match'
          ? `В источнике указаны: ${card.dataset.placeLabel}, ${card.dataset.fruitingLabel.toLocaleLowerCase('ru-RU')} и ${lightFact}. Срок сбора: ${card.dataset.periodLabel}.`
          : `Сорт остаётся в сравнении. В источнике нет данных по выбранным признакам: ${result.missing.join(', ')}.`;
        check.textContent = result.status === 'match'
          ? 'Сверьте описание сорта с условиями своего участка.'
          : 'Откройте карточку и источник, прежде чем делать вывод о пригодности.';
      }
    }
    const results = document.querySelector('#picker-results');
    const heading = (label, count) => {
      const node = document.createElement('h3');
      node.className = 'picker-group-heading';
      node.textContent = `${label} · ${count}`;
      return node;
    };
    const hasConditions = light !== 'unknown' || setting !== 'all' || fruiting !== 'all' || harvestTiming !== 'all';
    results.replaceChildren(
      ...(matches.length ? [heading(hasConditions ? 'Совпадают по выбранным признакам' : 'Сорта для сравнения', matches.length), ...matches] : []),
      ...(needsEvidence.length ? [heading('Нужно уточнить данные', needsEvidence.length), ...needsEvidence] : []),
      ...excluded
    );
    const visible = matches.length + needsEvidence.length;
    document.querySelector('#picker-title').textContent = visible ? `${visible} ${visible === 1 ? 'сорт для сравнения' : visible < 5 ? 'сорта для сравнения' : 'сортов для сравнения'}` : 'Совпадений нет';
    document.querySelector('#picker-region-status').textContent = `Регион: ${region}. Сравнение по опубликованным характеристикам сортов.`;
    const resultDescription = visible
      ? `${matches.length} совпадают по указанным признакам, для ${needsEvidence.length} нужно уточнить данные. Откройте карточку сорта и его источник.`
      : light === 'shade'
        ? 'Для заметной тени совпадений нет. Уточните освещённость или посмотрите весь каталог.'
        : 'Для выбранных условий совпадений нет. Измените одно условие или посмотрите весь каталог.';
    document.querySelector('#picker-description').textContent = resultDescription;
    const openQuestions = [];
    if (shelter === 'yes') openQuestions.push('планируется зимнее укрытие');
    if (shelter === 'no') openQuestions.push('зимнее укрытие не планируется');
    if (drainage === 'wet') openQuestions.push('после дождя вода долго стоит на участке');
    if (drainage === 'drained') openQuestions.push('вода после дождя быстро уходит');
    document.querySelector('#picker-conditions').textContent = openQuestions.length
      ? `Особенности участка: ${openQuestions.join('; ')}. Сверьте их с описанием сорта перед посадкой.`
      : 'Для точного выбора оцените, задерживается ли вода после дождя и нужно ли зимнее укрытие.';
    document.querySelector('#picker-empty').hidden = visible !== 0;
    output.hidden = false;
    output.dispatchEvent(new Event('picker:results'));
    output.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    output.focus({ preventScroll: true });
    trackGoal('selector_complete', { crop: String(crop), region, harvest_timing: String(harvestTiming), matches: visible });
  });
}
