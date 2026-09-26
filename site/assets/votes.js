import { validateVoteSnapshot, rankCultivars, recommendationLabel, snapshotDate } from './vote-model.js';
const tokenKey = 'malina-recommendations-v1';

export function browserVoterToken(storage, crypto) {
  let token = storage.getItem(tokenKey);
  if (!/^[a-f0-9]{64}$/.test(token || '')) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    token = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
    storage.setItem(tokenKey, token);
    if (storage.getItem(tokenKey) !== token) throw new Error('Browser storage unavailable');
  }
  return token;
}

export function createVoteClient(api, token, knownSlugs, request = fetch) {
  const known = new Set(knownSlugs);
  async function json(url, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await request(url, {
        method: body ? 'POST' : 'GET', cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: controller.signal,
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {})
      });
      if (!response.ok) throw new Error(response.status === 429 ? 'rate_limit' : 'unavailable');
      return await response.json();
    } finally { clearTimeout(timer); }
  }
  return {
    async totals() { return validateVoteSnapshot(await json(api), knownSlugs); },
    async state() {
      const body = await json(`${api}/state`, { voter_token: token });
      if (!body || !Array.isArray(body.recommended) || body.recommended.some(slug => typeof slug !== 'string' || !known.has(slug)) || new Set(body.recommended).size !== body.recommended.length) throw new Error('Invalid vote state');
      return new Set(body.recommended);
    },
    async set(slug, recommended) {
      if (!known.has(slug) || typeof recommended !== 'boolean') throw new Error('Invalid vote request');
      const body = await json(api, { cultivar_slug: slug, voter_token: token, recommended });
      if (!body || body.cultivar_slug !== slug || body.recommended !== recommended || !Number.isSafeInteger(body.count) || body.count < (recommended ? 1 : 0)) throw new Error('Invalid vote confirmation');
      return body;
    }
  };
}

async function mountVotes() {
  const widgets = [...document.querySelectorAll('[data-vote-widget]')];
  if (!widgets.length) return;
  const api = document.documentElement.dataset.voteApi || '';
  const knownSlugs = [...new Set(widgets.map(widget => widget.dataset.voteWidget))];
  const rows = [...document.querySelectorAll('[data-rating-slug]')];
  const rankingCultivars = rows.map(row => ({ slug: row.dataset.ratingSlug, name: row.dataset.ratingName, cropKey: row.dataset.ratingCrop }));
  const cropFilter = document.querySelector('#rating-crop');
  let snapshot, selected = new Set(), ready = false, client;
  const busy = new Set();
  function announce(slug, message) {
    widgets.filter(w => !slug || w.dataset.voteWidget === slug).forEach(w => { w.querySelector('.vote-status').textContent = message; });
  }
  function redraw() {
    widgets.forEach(widget => {
      const slug = widget.dataset.voteWidget;
      const button = widget.querySelector('[data-vote-button]');
      button.disabled = !ready || busy.size > 0;
      button.setAttribute('aria-pressed', String(selected.has(slug)));
      button.setAttribute('aria-label', `${selected.has(slug) ? 'Отменить рекомендацию сорта' : 'Рекомендовать сорт'} ${widget.dataset.voteName}`);
      button.querySelector('[aria-hidden]').textContent = selected.has(slug) ? '♥' : '♡';
      widget.querySelector('[data-vote-label]').textContent = selected.has(slug) ? 'Рекомендую · отменить' : 'Рекомендую';
      const count = snapshot?.votes.find(v => v.cultivar_slug === slug)?.count;
      if (count !== undefined) widget.querySelector('[data-vote-count]').textContent = recommendationLabel(count);
    });
    if (!snapshot || !rows.length) return;
    const ranked = rankCultivars(rankingCultivars, snapshot.votes, cropFilter?.value || 'all');
    const places = new Map(ranked.map(row => [row.slug, row.rank]));
    rows.forEach(row => {
      row.hidden = !places.has(row.dataset.ratingSlug);
      const rank = places.get(row.dataset.ratingSlug);
      const number = row.querySelector('[data-rating-place]');
      number.textContent = rank ?? '—';
      number.setAttribute('aria-label', rank ? `Место ${rank}` : 'Пока без места');
    });
    const list = document.querySelector('[data-rating-list]');
    ranked.forEach(row => list.append(rows.find(node => node.dataset.ratingSlug === row.slug)));
    document.querySelector('[data-rating-empty]').hidden = ranked.some(v => v.count > 0);
  }
  function freshness(live) {
    if (!snapshot) return;
    document.querySelectorAll('[data-vote-freshness]').forEach(node => {
      node.textContent = `${live ? 'Рекомендации обновлены' : 'Снимок рекомендаций'}: ${snapshotDate(snapshot.as_of)}`;
    });
  }
  cropFilter?.addEventListener('change', () => {
    redraw();
    document.querySelector('[data-rating-announcement]').textContent = `Показано сортов: ${rows.filter(row => !row.hidden).length}`;
  });
  try {
    snapshot = validateVoteSnapshot(JSON.parse(document.querySelector('#vote-snapshot').textContent), knownSlugs);
    redraw();
  } catch { /* The complete static HTML remains usable if its data is unavailable. */ }
  if (!api) return;
  let token;
  try { token = browserVoterToken(window.localStorage, window.crypto); }
  catch {
    announce('', 'Для голосования разрешите хранение данных в этом браузере.');
  }
  // Without writable browser storage, totals can still be read; no vote is sent.
  client = createVoteClient(api, token || '', snapshot?.votes.map(v => v.cultivar_slug) || knownSlugs);
  try { snapshot = await client.totals(); freshness(true); redraw(); } catch { freshness(false); }
  if (!token) return;
  try {
    selected = await client.state(); ready = true;
    announce('', ''); redraw();
  } catch {
    announce('', 'Голосование временно недоступно. Попробуйте обновить страницу.');
    return;
  }
  widgets.forEach(widget => widget.querySelector('[data-vote-button]').addEventListener('click', async () => {
    const slug = widget.dataset.voteWidget;
    if (!ready || busy.size > 0) return;
    busy.add(slug); redraw(); announce(slug, 'Сохраняем…');
    try {
      const result = await client.set(slug, !selected.has(slug));
      result.recommended ? selected.add(slug) : selected.delete(slug);
      if (snapshot) snapshot.votes = snapshot.votes.map(row => row.cultivar_slug === slug ? { ...row, count: result.count } : row);
      announce(slug, result.recommended ? 'Рекомендация сохранена. Спасибо!' : 'Рекомендация отменена.');
      // Refresh the aggregate timestamp only from the server, never from the browser clock.
      try { snapshot = await client.totals(); freshness(true); } catch {
        document.querySelectorAll('[data-vote-freshness]').forEach(node => { node.textContent = 'Ваш голос сохранён. Время обновления остальных рекомендаций уточняется.'; });
      }
    } catch (error) {
      // A lost response may follow a successful write. Reconcile before another click.
      try {
        selected = await client.state(); snapshot = await client.totals(); freshness(true);
        announce(slug, error.message === 'rate_limit' ? 'Слишком много запросов. Попробуйте чуть позже.' : 'Связь прервалась. Состояние голоса проверено; можно повторить.');
      } catch {
        ready = false;
        announce('', 'Не удалось проверить состояние голоса. Обновите страницу, чтобы продолжить.');
      }
    } finally { busy.delete(slug); redraw(); widget.querySelector('[data-vote-button]').focus({ preventScroll: true }); }
  }));
}

if (typeof document !== 'undefined') mountVotes();
