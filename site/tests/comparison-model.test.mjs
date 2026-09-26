import test from 'node:test';
import assert from 'node:assert/strict';
import { comparisonHref, getComparisonFacts, parseSelection, toggleSelection } from '../assets/comparison-model.mjs';
import { varieties } from '../data.mjs';

test('общая ссылка сохраняет город и регион вместе с выбором сортов', () => {
  assert.equal(
    comparisonHref('raspberry', ['polka', 'joan-j'], '?city=Калининград&region=Калининградская+область', '/MALINA'),
    '/MALINA/sravnenie/malina/?city=%D0%9A%D0%B0%D0%BB%D0%B8%D0%BD%D0%B8%D0%BD%D0%B3%D1%80%D0%B0%D0%B4&region=%D0%9A%D0%B0%D0%BB%D0%B8%D0%BD%D0%B8%D0%BD%D0%B3%D1%80%D0%B0%D0%B4%D1%81%D0%BA%D0%B0%D1%8F+%D0%BE%D0%B1%D0%BB%D0%B0%D1%81%D1%82%D1%8C&sort=polka%2Cjoan-j'
  );
});

test('общий выбор принимает известные сорта одной культуры, без дублей и больше четырёх', () => {
  assert.deepEqual(parseSelection('polka,joan-j,polka,elan,cambridge-favourite,unknown', varieties, 'raspberry'), ['polka', 'joan-j']);
});

test('добавление ограничено культурой и максимумом четырёх сортов', () => {
  const four = ['polka', 'joan-j'];
  assert.deepEqual(toggleSelection(four, 'elan', varieties, 'raspberry'), { selection: four, reason: 'wrong-crop' });
  const strawberry = ['cambridge-favourite', 'elan'];
  assert.deepEqual(toggleSelection(strawberry, 'polka', varieties, 'strawberry'), { selection: strawberry, reason: 'wrong-crop' });
  assert.deepEqual(toggleSelection(['a', 'b', 'c', 'd'], 'polka', varieties, 'raspberry'), { selection: ['a', 'b', 'c', 'd'], reason: 'limit' });
});

test('выбор можно отменить, а неизвестные характеристики имеют явное пустое значение', () => {
  assert.deepEqual(toggleSelection(['polka', 'joan-j'], 'polka', varieties, 'raspberry'), { selection: ['joan-j'], reason: null });
  const facts = getComparisonFacts(varieties.find(item => item.slug === 'polka'));
  assert.equal(facts.length, 5);
  assert.equal(facts.at(-1)[1], varieties.find(item => item.slug === 'polka').note);
  const incomplete = getComparisonFacts({ ...varieties[0], period: null });
  assert.equal(incomplete[2][1], null);
});
