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

const catalogForm = document.querySelector('#catalog-form');
if (catalogForm) {
  const cards = [...document.querySelectorAll('#catalog-results .variety-card')];
  const count = document.querySelector('#catalog-count');
  const empty = document.querySelector('#catalog-empty');
  const requestedFruiting = new URLSearchParams(location.search).get('fruiting');
  if (['remontant', 'summer'].includes(requestedFruiting)) catalogForm.elements.fruiting.value = requestedFruiting;
  const filter = () => {
    const data = new FormData(catalogForm);
    const crop = data.get('crop'); const setting = data.get('setting'); const fruiting = data.get('fruiting');
    const query = String(data.get('query') || '').trim().toLocaleLowerCase('ru');
    let visible = 0;
    for (const card of cards) {
      const show = (crop === 'all' || card.dataset.crop === crop) && (setting === 'all' || card.dataset.setting === setting) && (fruiting === 'all' || card.dataset.fruiting === fruiting) && card.dataset.name.includes(query);
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
if (pickerForm) pickerForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(pickerForm);
  const region = String(data.get('region') || '').trim();
  if (!region) { pickerForm.querySelector('#picker-region').focus(); return; }
  const crop = data.get('crop'); const setting = data.get('setting'); const light = data.get('light'); const fruiting = data.get('fruiting');
  const output = document.querySelector('#picker-output');
  const cards = [...document.querySelectorAll('#picker-results .variety-card')];
  let visible = 0;
  for (const card of cards) {
    const show = light === 'sun' && (crop === 'all' || card.dataset.crop === crop) && (setting === 'all' || card.dataset.setting === setting) && (fruiting === 'all' || card.dataset.fruiting === fruiting);
    card.hidden = !show;
    if (show) visible++;
  }
  document.querySelector('#picker-title').textContent = visible ? `${visible} ${visible === 1 ? 'сорт для сравнения' : visible < 5 ? 'сорта для сравнения' : 'сортов для сравнения'}` : 'Пока нет надёжного совпадения';
  document.querySelector('#picker-region-status').textContent = `Регион: ${region}. Подтверждённых данных о пригодности этих сортов для вашего региона пока нет. Ниже — справочное сравнение по опубликованным признакам, не региональная рекомендация.`;
  document.querySelector('#picker-description').textContent = visible ? 'Это записи, у которых опубликованный источник описывает выбранные признаки. Пригодность для вашего региона и наличие посадочного материала нужно проверить отдельно.' : 'Первая подборка пока ограничена. Лучше оставить вопрос открытым, чем предложить сорт без подтверждённых данных.';
  document.querySelector('#picker-empty').hidden = visible !== 0;
  output.hidden = false;
  output.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  output.focus({ preventScroll: true });
  trackGoal('selector_complete', { crop: String(crop), region, matches: visible });
});
