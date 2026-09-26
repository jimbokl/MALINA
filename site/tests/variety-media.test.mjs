import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { varieties } from '../data.mjs';
import { cultivarImage } from '../variety-media.mjs';

const assetsDir = new URL('../assets/', import.meta.url);
// The approved image was visually checked: ripe berries are yellow/gold, not red.
const approvedYellowImageSha256 = 'd4bf84d2ee483aa44f5d63120291f0107f41b35cec5e3d7ca756919260d4cb6d';

test('проверенная жёлтая иллюстрация не заменена другим изображением', async () => {
  const bytes = await readFile(new URL('raspberry-yellow-garden.webp', assetsDir));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), approvedYellowImageSha256);
});

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
