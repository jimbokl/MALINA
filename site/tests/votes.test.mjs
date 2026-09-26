import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateVoteSnapshot, rankCultivars, recommendationLabel } from '../assets/vote-model.js';
import { browserVoterToken, createVoteClient } from '../assets/votes.js';
import { resolveVoteApi } from '../votes.mjs';
import { varieties } from '../data.mjs';

const snapshot = { as_of: '2026-09-26T10:00:00Z', votes: [
  { cultivar_slug: 'polka', count: 4 }, { cultivar_slug: 'joan-j', count: 4 },
  { cultivar_slug: 'elan', count: 2 }, { cultivar_slug: 'aziya', count: 0 }, { cultivar_slug: 'gusar', count: 0 }, { cultivar_slug: 'cambridge-favourite', count: 0 },
  { cultivar_slug: 'murano', count: 0 }, { cultivar_slug: 'alba', count: 0 }
] };

test('рейтинг делит места при равенстве, оставляет нули без места и пересчитывает культуру', () => {
  const ranked = rankCultivars(varieties, snapshot.votes);
  assert.deepEqual(ranked.map(v => [v.slug, v.rank]), [['joan-j', 1], ['polka', 1], ['elan', 3], ['aziya', null], ['alba', null], ['gusar', null], ['cambridge-favourite', null], ['murano', null]]);
  const strawberry = rankCultivars(varieties, snapshot.votes, 'strawberry');
  assert.deepEqual(strawberry.map(v => [v.slug, v.rank]), [['elan', 1], ['aziya', null], ['alba', null], ['cambridge-favourite', null], ['murano', null]]);
  const empty = rankCultivars(varieties, snapshot.votes.map(v => ({ ...v, count: 0 })));
  assert.ok(empty.every(v => v.rank === null));
  assert.deepEqual(empty.map(v => v.slug), ['aziya', 'alba', 'gusar', 'joan-j', 'cambridge-favourite', 'murano', 'polka', 'elan']);
});

test('публичный контракт отклоняет повреждённые счётчики и пропавшие сорта', () => {
  assert.deepEqual(validateVoteSnapshot(snapshot, varieties.map(v => v.slug)), snapshot);
  for (const count of [-1, 1.2, '3', Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => validateVoteSnapshot({ ...snapshot, votes: [{ cultivar_slug: 'polka', count }] }));
  }
  assert.throws(() => validateVoteSnapshot({ ...snapshot, votes: [...snapshot.votes, snapshot.votes[0]] }));
  assert.throws(() => validateVoteSnapshot({ ...snapshot, as_of: 'invalid' }));
  assert.throws(() => validateVoteSnapshot(snapshot, ['missing']));
  assert.equal(recommendationLabel(1), '1 рекомендация');
  assert.equal(recommendationLabel(12), '12 рекомендаций');
  assert.equal(recommendationLabel(22), '22 рекомендации');
});

test('API голосов выводится только из корректного адреса отзывов', () => {
  assert.equal(resolveVoteApi('', 'https://api.example.org/api/reviews'), 'https://api.example.org/api/votes');
  assert.equal(resolveVoteApi('', 'https://api.example.org/api/reviews?test=1'), '');
  assert.equal(resolveVoteApi('http://127.0.0.1:8090/api/votes'), 'http://127.0.0.1:8090/api/votes');
  for (const url of ['https://u:p@example.org/api/votes', 'http://example.org/api/votes', 'https://example.org/api/votes?key=secret', 'https://example.org/api/votes#secret', 'javascript:alert(1)', 'https://example.org/api/reviews']) assert.throws(() => resolveVoteApi(url));
});

test('браузер сохраняет случайный 256-битный ключ и повторно использует его', () => {
  const saved = new Map();
  const storage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
  let calls = 0;
  const random = { getRandomValues: bytes => { calls++; bytes.fill(17); return bytes; } };
  const token = browserVoterToken(storage, random);
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.equal(browserVoterToken(storage, random), token);
  assert.equal(calls, 1);
  assert.throws(() => browserVoterToken({ getItem: () => null, setItem: () => {} }, random));
});

test('голос передаётся в теле POST с желаемым состоянием; ошибка не становится успехом', async () => {
  const token = 'a'.repeat(64), requests = [];
  const responses = [{ recommended: ['polka'] }, { cultivar_slug: 'polka', count: 5, recommended: true }, { cultivar_slug: 'polka', count: 4, recommended: false }];
  const client = createVoteClient('https://example.org/api/votes', token, ['polka'], async (url, options) => {
    requests.push([url, options]); return { ok: true, json: async () => responses.shift() };
  });
  assert.deepEqual(await client.state(), new Set(['polka']));
  assert.equal((await client.set('polka', true)).count, 5);
  assert.equal((await client.set('polka', false)).count, 4);
  for (const [url, options] of requests) {
    assert.ok(!url.includes(token)); assert.equal(options.method, 'POST');
    assert.equal(options.credentials, 'omit'); assert.equal(JSON.parse(options.body).voter_token, token);
  }
  assert.equal(JSON.parse(requests[1][1].body).recommended, true);
  assert.equal(JSON.parse(requests[2][1].body).recommended, false);
  const failing = createVoteClient('https://example.org/api/votes', token, ['polka'], async () => ({ ok: false, status: 503 }));
  await assert.rejects(failing.set('polka', true));
  const mismatched = createVoteClient('https://example.org/api/votes', token, ['polka'], async () => ({ ok: true, json: async () => ({ cultivar_slug: 'polka', count: 8, recommended: false }) }));
  await assert.rejects(mismatched.set('polka', true));
});

test('в статическом HTML есть рейтинг, реальные агрегаты, методика и голос у каждого сорта', async () => {
  const rating = await readFile(new URL('../../dist/rating/index.html', import.meta.url), 'utf8');
  const data = JSON.parse(await readFile(new URL('../../dist/data/votes.json', import.meta.url), 'utf8'));
  assert.match(rating, /id="rating-crop"/);
  assert.match(rating, /id="rating-method"/);
  assert.match(rating, /число рекомендаций не равно числу уникальных людей/);
  assert.match(rating, /Популярность не подтверждает пригодность/);
  assert.doesNotMatch(rating, /AggregateRating|ratingValue/);
  assert.match(rating, /data-vote-freshness/);
  for (const variety of varieties) {
    const html = await readFile(new URL(`../../dist/sorta/${variety.slug}/index.html`, import.meta.url), 'utf8');
    assert.match(html, new RegExp(`data-vote-widget="${variety.slug}"`));
    assert.match(html, /aria-pressed="false"/);
    assert.match(html, /data-vote-freshness/);
    const count = data.votes.find(v => v.cultivar_slug === variety.slug).count;
    assert.ok(html.includes(recommendationLabel(count)));
    assert.ok(rating.includes(`data-rating-slug="${variety.slug}"`));
  }
  assert.deepEqual(Object.keys(data).sort(), ['as_of', 'votes']);
  assert.ok(data.votes.every(v => Object.keys(v).sort().join(',') === 'count,cultivar_slug'));
});
