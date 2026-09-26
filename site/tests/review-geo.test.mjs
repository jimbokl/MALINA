import test from 'node:test';
import assert from 'node:assert/strict';
import { describeReviewPlace, filterReviewThreads, matchesReviewPlace, normalizeReviewPlace } from '../assets/review-geo.js';

const review = (id, region, parent_id = null, cultivar_name = 'Полька') => ({ id, region, parent_id, cultivar_name });
const ids = reviews => reviews.map(item => item.id);

test('place matching handles ordinary input formatting without partial city matches', () => {
  assert.equal(normalizeReviewPlace('  г. Орёл  '), 'орел');
  assert.ok(matchesReviewPlace('КАЛИНИНГРАДСКАЯ ОБЛ.', { region: 'Калининградская область' }));
  assert.ok(matchesReviewPlace('Ростов — на — Дону', { city: 'Ростов-на-Дону' }));
  assert.ok(matchesReviewPlace('г.Калининград, Калининградская область', { city: 'Калининград' }));
  assert.ok(matchesReviewPlace('Калининградская обл.; Советск', { region: 'Калининградская область' }));
  assert.ok(matchesReviewPlace('Калининград, Калининградская область', { city: 'Калининград, Калининградская область' }));
  for (const place of ['', ' ', null, undefined, 'Калинин', 'Новокалининград', 'Калининградская область']) {
    assert.equal(matchesReviewPlace(place, { city: 'Калининград' }), false, `Unexpected match: ${place}`);
  }
  assert.equal(matchesReviewPlace('Москва', { city: 'Московская область' }), false);
  assert.equal(matchesReviewPlace('Нижний Новгород', { city: 'Новгород' }), false);
  assert.equal(matchesReviewPlace('Калининград', {}), false);
});

test('city review keeps the complete Anna–Elena discussion across regions', () => {
  const reviews = [
    review(1, 'Калининград'),
    review(2, 'Кишинёв', 1),
    review(3, 'Калининград', 2),
    review(4, 'Москва', 2),
    review(5, 'Кишинёв'),
    review(6, 'Калининград', 5),
  ];
  assert.deepEqual(ids(filterReviewThreads(reviews, { city: 'Калининград' })), [1, 2, 3, 4]);
  // A reply from another city does not relabel the root's growing experience.
  assert.deepEqual(ids(filterReviewThreads(reviews, { city: 'Кишинев' })), [5, 6]);
  assert.deepEqual(ids(filterReviewThreads(reviews)), [1, 2, 3, 4, 5, 6]);
});

test('region is explicitly opt-in and combined with cultivar, rather than bypassed by it', () => {
  const reviews = [
    review(1, 'Калининград'),
    review(2, 'Калининградская область'),
    review(3, 'Калининградская область, Советск'),
    review(4, 'Калининград', null, 'Атлант'),
    review(5, 'Кишинёв', 2),
    review(6, ''),
    review(7, 'Москва'),
  ];
  assert.deepEqual(ids(filterReviewThreads(reviews, { city: 'Калининград', cultivar: 'полька' })), [1]);
  assert.deepEqual(ids(filterReviewThreads(reviews, {
    city: 'Калининград', region: 'Калининградская область', cultivar: 'Полька'
  })), [1, 2, 3, 5]);
  assert.deepEqual(ids(filterReviewThreads(reviews, { region: 'Калининградская область' })), [2, 3, 5]);
  assert.deepEqual(ids(filterReviewThreads(reviews, { city: 'Омск', cultivar: 'Полька' })), []);
  assert.equal(describeReviewPlace({ city: 'Калининград', region: 'Калининградская область' }),
    'Город: Калининград или регион: Калининградская область (целиком)');
  assert.equal(describeReviewPlace({ city: 'Москва', region: 'Москва' }), 'Место: Москва');
  assert.equal(describeReviewPlace({ region: 'Московская область' }), 'Регион: Московская область');
});

test('orphaned and cyclic replies are not promoted to roots; input order and data stay intact', () => {
  const reviews = [review(3, 'Кишинёв', 2), review(2, 'Москва', 1), review(1, 'Калининград'),
    review(4, 'Калининград', 99), review(5, 'Калининград', 6), review(6, 'Москва', 5)];
  const before = structuredClone(reviews);
  assert.deepEqual(ids(filterReviewThreads(reviews, { city: 'Калининград' })), [3, 2, 1]);
  assert.deepEqual(ids(filterReviewThreads(reviews)), [3, 2, 1]);
  assert.deepEqual(reviews, before);
});
