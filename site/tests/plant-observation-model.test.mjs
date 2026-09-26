import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateObservation } from '../assets/plant-observation-model.mjs';

const base = { crop: 'raspberry', symptom: 'yellow', moisture: 'unknown', pattern: 'unknown', spread: 'single' };

test('пожелтение с зелёными жилками не становится диагнозом или рецептом удобрения', () => {
  const answer = evaluateObservation({ ...base, pattern: 'veins' });
  assert.match(answer.summary, /не доказывает дефицит железа/);
  assert.match(answer.steps.join(' '), /анализ почвы/);
  assert.doesNotMatch(answer.steps.join(' '), /внесите железо|опрыскайте/);
  assert.ok(answer.sources.some(source => source.url.includes('herbicide-injury')));
});

test('увядание в мокрой почве не ведёт к усиленному поливу', () => {
  const answer = evaluateObservation({ ...base, crop: 'strawberry', symptom: 'wilt', moisture: 'wet', spread: 'patch' });
  assert.match(answer.summary, /добавлять воду.*не стоит/);
  assert.match(answer.steps.join(' '), /корни и основание/);
  assert.ok(answer.sources.some(source => source.url.includes('crown-and-root-issues-in-strawberries')));
  assert.ok(answer.sources.every(source => !source.url.includes('raspberry')));
});

test('массовое поражение добавляет проверку общих факторов и направление к специалисту', () => {
  const answer = evaluateObservation({ ...base, crop: 'strawberry', symptom: 'wilt', moisture: 'normal', spread: 'many' });
  assert.match(answer.steps[2], /много растений/);
  assert.match(answer.steps[2], /очная проверка/);
  assert.match(answer.limitation, /не диагноз/);
});

test('неизвестные параметры не приводят к молчаливой подмене решения', () => {
  assert.throws(() => evaluateObservation({ ...base, crop: 'tomato' }), /crop/);
  assert.throws(() => evaluateObservation({ ...base, moisture: 'flood' }), /moisture/);
});
