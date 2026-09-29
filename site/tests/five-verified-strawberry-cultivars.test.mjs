import assert from 'node:assert/strict';
import test from 'node:test';
import { additionalStrawberryVarieties } from '../strawberry-varieties.mjs';

const expected = {
  divnaya: ['13 т/га', '12,5 г', '4,6 балла'],
  tsarskoselskaya: ['15,5 т/га', '11 г'],
  sudarushka: ['9 т/га', '9,4 г'],
  zenit: ['выше 12 г', '4,5 балла', 'дружно'],
  'kokinskaya-rannyaya': ['10,2 т/га', '108,3 г']
};

test('five new Russian-source strawberry cultivar cards retain researched facts and citations', () => {
  const cards = new Map(additionalStrawberryVarieties.map(card => [card.slug, card]));
  for (const [slug, terms] of Object.entries(expected)) {
    const card = cards.get(slug);
    assert.ok(card, `missing ${slug}`);
    assert.equal(card.cropKey, 'strawberry');
    assert.ok(card.name);
    assert.match(card.source, /^https:\/\//);
    assert.match(card.secondarySource, /gossortrf\.ru/);
    assert.ok(card.evidenceNote.includes('2010–2015') || card.evidenceNote.includes('2006–2007'));
    for (const term of terms) {
      const copy = `${card.note} ${card.evidenceNote} ${card.traits.join(' ')}`.toLocaleLowerCase('ru');
      assert.ok(copy.includes(term.toLocaleLowerCase('ru')), `${slug} missing ${term}`);
    }
    assert.doesNotMatch(card.note, /\d+(?:[,.]\d+)?\s*(?:г|т\/га|балл)/);
    assert.ok(!`${card.name} ${card.note} ${card.traits.join(' ')}`.toLowerCase().includes('садовая земляника'));
  }
});

test('cultivar cards link observations to the correct Russian field-study institution and period', () => {
  const cards = new Map(additionalStrawberryVarieties.map(card => [card.slug, card]));
  for (const slug of ['divnaya', 'tsarskoselskaya', 'sudarushka', 'zenit']) {
    const card = cards.get(slug);
    assert.match(card.sourceLabel, /ВИР/);
    assert.match(card.sourceLabel, /Ленинградской области, 2010–2015/);
  }
  const kokinskaya = cards.get('kokinskaya-rannyaya');
  assert.match(kokinskaya.sourceLabel, /ВНИИСПК/);
  assert.match(kokinskaya.sourceLabel, /Кокино, 2006–2008/);
  assert.equal(kokinskaya.harvestTiming, 'early');
});
