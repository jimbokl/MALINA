import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { cultivarSearchAnswers } from '../cultivar-search-answers.mjs';

// A search answer must survive SSR and lead to an existing, useful next step.
// This also catches accidental comparison URLs without their crop segment.
test('published search answers and their next steps resolve in static HTML', () => {
  for (const [slug, entry] of Object.entries(cultivarSearchAnswers)) {
    const html = readFileSync(new URL(`../../dist/sorta/${slug}/index.html`, import.meta.url), 'utf8');
    assert.ok(html.includes(entry.description), `${slug}: custom description missing`);
    assert.ok(html.includes(`id="questions-${slug}"`), `${slug}: answer section missing`);
    for (const item of entry.questions) {
      assert.ok(html.includes(item.question), `${slug}: question missing from SSR`);
      assert.ok(html.includes(item.answer), `${slug}: answer missing from SSR`);
      assert.ok(html.includes(item.source.url), `${slug}: supporting source missing`);
      const url = new URL(item.link[0], 'https://malinaklubnika.ru');
      const target = new URL(`../../dist${url.pathname}index.html`, import.meta.url);
      assert.ok(existsSync(target), `${slug}: broken next step ${item.link[0]}`);
      if (url.hash) assert.ok(readFileSync(target, 'utf8').includes(`id="${url.hash.slice(1)}"`), `${slug}: missing anchor`);
    }
  }
});
