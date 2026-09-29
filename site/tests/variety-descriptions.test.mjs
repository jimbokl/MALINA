import test from 'node:test';
import assert from 'node:assert/strict';
import { varieties } from '../data.mjs';
import { varietyDescriptions, varietyDescriptionSources } from '../variety-descriptions.mjs';

test('every published cultivar has a complete editorial description', () => {
  const slugs = varieties.map(variety => variety.slug);
  assert.deepEqual(Object.keys(varietyDescriptions).sort(), [...slugs].sort());
  for (const slug of slugs) {
    const paragraphs = varietyDescriptions[slug];
    assert.equal(paragraphs.length, 2, `${slug}: expected two paragraphs`);
    assert.ok(paragraphs.every(paragraph => typeof paragraph === 'string' && paragraph.trim().length > 100), `${slug}: paragraph is too short`);
    assert.ok(paragraphs.join(' ').length >= 400, `${slug}: description is too short`);
    assert.doesNotMatch(paragraphs.join(' '), /<[^>]+>|\bRHS\b|https?:\/\//i, `${slug}: raw HTML or source in prose`);
  }
});

test('additional sources belong to published cultivars and have usable links', () => {
  const slugs = new Set(varieties.map(variety => variety.slug));
  for (const [slug, sources] of Object.entries(varietyDescriptionSources)) {
    assert.ok(slugs.has(slug), `unknown cultivar: ${slug}`);
    assert.ok(Array.isArray(sources) && sources.length > 0, `${slug}: empty sources`);
    for (const source of sources) {
      assert.match(source.url, /^https:\/\/[^\s]+$/);
      assert.ok(source.label?.trim(), `${slug}: source without a label`);
    }
  }
});
