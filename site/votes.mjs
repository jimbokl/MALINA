import { rankCultivars, recommendationLabel, snapshotDate } from './assets/vote-model.js';
const e = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function resolveVoteApi(explicit, reviewApi = '') {
  const raw = explicit || (reviewApi.endsWith('/api/reviews') ? reviewApi.replace(/\/api\/reviews$/, '/api/votes') : '');
  if (!raw) return '';
  let url;
  try { url = new URL(raw); } catch { throw new Error('Invalid VOTE_API_URL'); }
  const local = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname) && url.port;
  if ((!local && url.protocol !== 'https:') || url.username || url.password || url.search || url.hash || url.pathname !== '/api/votes') {
    throw new Error('VOTE_API_URL must be HTTPS /api/votes, except localhost development');
  }
  return url.href;
}

export function voteWidget(v, snapshot, api) {
  const count = snapshot.votes.find(row => row.cultivar_slug === v.slug)?.count ?? 0;
  return `<div class="cultivar-vote" data-vote-widget="${e(v.slug)}" data-vote-name="${e(v.name)}"><div class="vote-action"><button class="vote-button" type="button" data-vote-button aria-pressed="false" aria-label="Рекомендовать сорт ${e(v.name)}" disabled><span aria-hidden="true">♡</span> <span data-vote-label>Рекомендую</span></button><span class="vote-count" data-vote-count="${e(v.slug)}">${e(recommendationLabel(count))}</span></div><p class="vote-status" role="status" aria-live="polite">${api ? 'Подключаем голосование…' : 'Голосование временно недоступно.'}</p><noscript><p class="vote-status">Для голосования включите JavaScript.</p></noscript></div>`;
}

export function voteFreshness(snapshot) {
  return `<p class="vote-freshness" data-vote-freshness>Снимок рекомендаций: <time datetime="${e(snapshot.as_of)}">${e(snapshotDate(snapshot.as_of))}</time></p>`;
}

export function ratingBody(varieties, snapshot, api) {
  const rows = rankCultivars(varieties, snapshot.votes);
  return `<section class="simple-hero rating-hero"><div class="wrap"><div class="breadcrumbs"><a href="/">Главная</a><span> / </span><a href="/sorta/">Каталог</a><span> / </span>Рейтинг</div><span class="eyebrow">ВЫБОР ЧИТАТЕЛЕЙ</span><h1>Сорта, которые<br><em>рекомендуют.</em></h1><p>Один голос — одна рекомендация сорта. Делитесь своим выбором и смотрите, какие сорта отмечают другие садоводы.</p><a class="text-link" href="#rating-method">Как устроен рейтинг ↓</a></div></section><section class="section wrap rating-section" data-rating-root><div class="rating-toolbar"><h2>Рекомендации садоводов</h2><label for="rating-crop">Культура<select id="rating-crop"><option value="all">Все культуры</option><option value="raspberry">Малина</option><option value="strawberry">Клубника</option></select></label></div>${voteFreshness(snapshot)}<p class="rating-empty" data-rating-empty${rows.some(v => v.count > 0) ? ' hidden' : ''}>Первые голоса ещё впереди. Пока сорта показаны по алфавиту, без мест в рейтинге.</p><div class="rating-list" data-rating-list>${rows.map(v => `<article class="rating-row" data-rating-slug="${e(v.slug)}" data-rating-crop="${e(v.cropKey)}" data-rating-name="${e(v.name)}"><div class="rating-place" data-rating-place aria-label="${v.rank ? `Место ${v.rank}` : 'Пока без места'}">${v.rank ?? '—'}</div><div class="rating-cultivar"><span class="eyebrow">${e(v.crop)}</span><h3><a href="/sorta/${e(v.slug)}/">${e(v.name)}</a></h3><p>${e(v.fruitingLabel)}</p><a class="rating-reviews" href="/sorta/${e(v.slug)}/#otzyvy">Опыт выращивания и отзывы ↗</a></div>${voteWidget(v, snapshot, api)}</article>`).join('')}</div><p data-rating-announcement class="sr-only" aria-live="polite"></p><noscript><p>Фильтр по культуре работает с JavaScript. Все сорта доступны в списке выше.</p></noscript></section><section class="section wrap rating-method" id="rating-method"><span class="eyebrow">ПОНЯТНАЯ МЕТОДИКА</span><h2>Что означает голос</h2><div class="rating-method-grid"><div><h3>Ваш выбор</h3><p>Нажмите «Рекомендую», если готовы посоветовать сорт. Повторное нажатие отменит голос. Чтобы рассказать об урожае, вкусах и условиях участка, оставьте отзыв в карточке сорта.</p></div><div><h3>Место и число голосов</h3><p>Чем больше активных рекомендаций, тем выше сорт. Равное число голосов даёт одинаковое место: например, 1, 1, 3. После выбора культуры места считаются внутри неё. Без голосов места нет; при равенстве сортируем названия по алфавиту.</p></div><div><h3>Границы рейтинга</h3><p>Один браузер может оставить один активный голос за каждый сорт. Очистка его хранилища или другой браузер позволяют проголосовать снова: число рекомендаций не равно числу уникальных людей. Популярность не подтверждает пригодность для вашего региона, вкус или урожайность.</p></div></div><p><a class="text-link" href="/podbor/">Сравнить сорта с условиями участка ↗</a></p></section>`;
}
