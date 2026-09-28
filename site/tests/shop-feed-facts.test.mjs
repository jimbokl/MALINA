import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractShopFeedFacts } from '../shop-feed-facts.mjs';

test('extracts only short seller statements from glued feed sections', () => {
  const product = {
    name: 'Земляника садовая Альба',
    description: 'ПрименениеУрожайность высокая.Срок созреванияРанний срок созревания.Плоды (ягоды)Ягоды удлинённой формы, красные. Урожай до 10 кг с куста.Дерево (куст)Куст компактный.ЗимостойкостьДо -35.Условия выращиванияПодходят солнечные участки.'
  };
  const facts = extractShopFeedFacts(product);
  assert.deepEqual(facts.map(fact => fact.kind), ['ripening', 'fruit', 'bush']);
  assert.deepEqual(facts.map(fact => fact.text), [
    'Ранний срок созревания.',
    'Ягоды удлинённой формы, красные.',
    'Куст компактный.'
  ]);
  for (const fact of facts) {
    assert.equal(fact.attribution, 'merchant_description');
    assert.ok(product.description.includes(fact.source));
  }
});

test('keeps a planting condition when fewer than three higher-priority traits qualify', () => {
  const facts = extractShopFeedFacts({
    name: 'Малина Пример',
    description: 'Плоды(ягоды)Ягоды красные, округлой формы.Дерево(куст)Побеги в высоту .Условия выращиванияДля посадки подходят солнечные участки.'
  });
  assert.deepEqual(facts.map(fact => fact.kind), ['fruit', 'planting']);
  assert.doesNotMatch(facts.map(fact => fact.text).join(' '), /Побеги в высоту/u);
});

test('rejects broken fragments and claims requiring independent agronomic evidence', () => {
  const facts = extractShopFeedFacts({
    name: 'Малина Пример',
    description: 'Срок созреванияРанний срок созревания.Плоды(ягоды)Ягоды . Плоды дают урожай до 20 кг с куста. Ягоды красные, сладкие.Дерево(куст)Куст зимостойкий до -35. Побеги в высоту .Условия выращиванияПодходит для любого региона, устойчива к болезням. Ягоды обладают лечебными свойствами.'
  });
  assert.deepEqual(facts.map(fact => fact.text), ['Ранний срок созревания.', 'Ягоды красные, сладкие.']);
});

test('section labels do not turn weight, general variety prose, or bush traits into other kinds', () => {
  const facts = extractShopFeedFacts({
    name: 'Земляника садовая Пример',
    description: 'Срок созреванияСредний вес плодов – 5-6 г. Раннеспелые ремонтантные сорта плодоносят весь сезон.Плоды (ягоды)Ягода относится к среднепоздней, имеет мощный куст и красные плоды. Ягоды конические, красного цвета.Дерево (куст)Куст компактный.'
  });
  assert.deepEqual(facts.map(fact => fact.kind), ['fruit', 'bush']);
  assert.equal(facts[0].text, 'Ягоды конические, красного цвета.');
});

test('ripening group keeps exact evidence while omitting an unsituated calendar date', () => {
  const source = 'Среднего срока созревания(июль).';
  const facts = extractShopFeedFacts({ name: 'Земляника садовая Пример', description: `Срок созревания${source}` });
  assert.equal(facts[0].kind, 'ripening');
  assert.equal(facts[0].source, source);
  assert.equal(facts[0].text, 'Среднего срока созревания.');
});

test('common planting boilerplate is omitted even when it appears under the correct label', () => {
  const facts = extractShopFeedFacts({
    name: 'Малина Пример',
    description: 'Условия выращиванияДля посадки лучше всего подходят солнечные участки, но растение также переносит легкое затенение. Почва должна быть легкой, питательной с высоким уровнем кислотности.'
  });
  assert.deepEqual(facts, []);
});

test('copied cross-cultivar trait phrases and inflected yield claims are omitted', () => {
  const facts = extractShopFeedFacts({
    name: 'Земляника садовая Ромина',
    description: 'Плоды (ягоды)Ягода темноокрашенная, ширококоническая, с блестящей плотной кожицей (масса ягод первого сбора 45-50 г). Ягода большая, размер стабилен во время сбора урожая. Ягоды красные, конические.Дерево (куст)Куст мощный, хорошо облиственный, цветоносы на уровне листьев, толстые. Куст среднерослый.'
  });
  assert.deepEqual(facts.map(fact => fact.text), ['Ягоды красные, конические.', 'Куст среднерослый.']);
});

test('rejects a sentence naming a different cultivar but retains another direct trait', () => {
  const facts = extractShopFeedFacts({
    name: 'Земляника садовая Богема',
    description: 'Плоды (ягоды)Ягоды сорта Фейт красные и сладкие. Ягоды плотные, конической формы.Дерево (куст)Кусты сорта Фейт компактные. Куст среднерослый, хорошо облиственный.'
  });
  assert.deepEqual(facts.map(fact => fact.text), [
    'Ягоды плотные, конической формы.',
    'Куст среднерослый, хорошо облиственный.'
  ]);
});

test('shared merchant descriptions are suppressed for every field', () => {
  assert.deepEqual(extractShopFeedFacts({
    name: 'Земляника садовая Богема', merchantDescriptionShared: true,
    description: 'Плоды (ягоды)Ягоды плотные и красные.'
  }), []);
  assert.deepEqual(extractShopFeedFacts(null), []);
  assert.deepEqual(extractShopFeedFacts({ description: '' }), []);
});

test('catalog facts always point to exact source text and avoid unsupported topics', () => {
  const products = JSON.parse(readFileSync(new URL('../shop-catalog.json', import.meta.url), 'utf8'));
  for (const product of products) {
    const facts = extractShopFeedFacts(product);
    assert.ok(facts.length <= 3, product.id);
    assert.equal(new Set(facts.map(fact => fact.kind)).size, facts.length, product.id);
    for (const fact of facts) {
      assert.ok(product.description.includes(fact.source), `${product.id}: ${fact.source}`);
      assert.ok(fact.text.length >= 15 && fact.text.length <= 175, product.id);
      assert.doesNotMatch(fact.text, /урожа|зимостой|мороз|регион|лечеб|болезн|продуктив/iu, product.id);
      assert.doesNotMatch(fact.text, /(?:Ягоды|Побеги)\s+\./u, product.id);
    }
  }
});
