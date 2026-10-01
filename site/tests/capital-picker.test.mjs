import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveAdmissionSelection } from '../assets/admissions-model.mjs';

const root = process.env.MALINA_TEST_DIST || fileURLToPath(new URL('../../dist/', import.meta.url));

test('Москва и Петербург получают сорта обеих культур и передают садовый регион в карточку', async () => {
  const catalog = JSON.parse(await readFile(join(root, 'data/catalog.json'), 'utf8'));
  const cities = JSON.parse(await readFile(join(root, 'data/cities.json'), 'utf8'));
  for (const [slug, name, regionName, number] of [
    ['moscow', 'Москва', 'Московская область', 3],
    ['saint-petersburg', 'Санкт-Петербург', 'Ленинградская область', 2]
  ]) {
    const html = await readFile(join(root, 'podbor', slug, 'index.html'), 'utf8');
    assert.ok(html.includes(`data-city="${name}" data-region="${regionName}"`));
    assert.ok(html.includes(`name="region" value="${name}"`));
    assert.ok(html.includes(`<option value="${name}" data-region="${regionName}" data-city="${name}"`));
    assert.ok(html.includes(`<option value="${regionName}" data-region="${regionName}" data-city=""`));
    const region = catalog.regions.find(item => item.name_ru === regionName);
    assert.equal(region.admission_region_number, number);
    for (const crop of ['raspberry', 'strawberry']) {
      const cultivar = catalog.cultivars.find(item => item.crop_slug === crop &&
        item.admissions.some(admission => admission.admission_region_number === number));
      assert.ok(cultivar, `${slug}: no ${crop} candidate`);
      const query = new URLSearchParams({ city: name, region: regionName }).toString().replaceAll('&', '&amp;');
      assert.ok(html.includes(`/sorta/${cultivar.slug}/?${query}#otzyvy`));
      const varietyHtml = await readFile(join(root, 'sorta', cultivar.slug, 'index.html'), 'utf8');
      const places = JSON.parse(varietyHtml.match(/<script class="admission-place-data" type="application\/json">([^<]+)<\/script>/)[1]);
      const selection = resolveAdmissionSelection(`?city=${encodeURIComponent(name)}&region=${encodeURIComponent(regionName)}`,
        places, cultivar.admissions.map(admission => admission.admission_region_number));
      assert.equal(selection.kind, 'admitted');
      assert.equal(selection.place.city.name, name);
    }
    assert.equal(cities.find(city => city.slug === slug).region, name);
  }
});
