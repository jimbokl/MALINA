import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { varieties } from '../data.mjs';
import { cultivarImage } from '../variety-media.mjs';

const assetsDir = new URL('../assets/', import.meta.url);

test('все жёлтоплодные сорта малины используют жёлтую иллюстрацию', () => {
  const yellow = varieties.filter((variety) => variety.cropKey === 'raspberry' && variety.fruitColor === 'yellow');
  assert.ok(yellow.length > 0, 'в каталоге должны быть жёлтоплодные сорта');
  for (const variety of yellow) {
    const image = cultivarImage(variety);
    assert.equal(image.src, '/assets/raspberry-yellow-garden.webp', variety.slug);
    assert.match(image.alt, /жёлтой малины/, variety.slug);
    assert.ok(existsSync(fileURLToPath(new URL(image.src.split('/').at(-1), assetsDir))), variety.slug);
  }
});

test('красная малина не получает жёлтую общую иллюстрацию', () => {
  for (const variety of varieties.filter((item) => item.cropKey === 'raspberry' && item.fruitColor === 'red')) {
    assert.notEqual(cultivarImage(variety).src, '/assets/raspberry-yellow-garden.webp', variety.slug);
  }
});
