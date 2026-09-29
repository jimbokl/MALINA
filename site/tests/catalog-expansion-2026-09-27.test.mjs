import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { varieties } from '../data.mjs';
import { cultivarImage } from '../variety-media.mjs';

const expected = [
  ['pshehiba', 'raspberry', 'Пшехиба'],
  ['karamelka', 'raspberry', 'Карамелька'],
  ['samohval', 'raspberry', 'Самохвал'],
  ['patritsiya', 'raspberry', 'Патриция'],
  ['tarusa', 'raspberry', 'Таруса'],
  ['lyachka', 'raspberry', 'Лячка'],
  ['maroseyka', 'raspberry', 'Маросейка'],
  ['brilliantovaya', 'raspberry', 'Бриллиантовая'],
  ['malvina', 'strawberry', 'Мальвина'],
  ['albion', 'strawberry', 'Альбион'],
  ['honey', 'strawberry', 'Хоней'],
  ['kimberli', 'strawberry', 'Кимберли'],
  ['cabrillo', 'strawberry', 'Кабрилло'],
  ['brilla', 'strawberry', 'Брилла'],
  ['magnus', 'strawberry', 'Магнус'],
  ['rumba', 'strawberry', 'Румба'],
  ['elsanta', 'strawberry', 'Эльсанта'],
  ['borovitskaya', 'strawberry', 'Боровицкая'],
  ['nashe-podmoskove', 'strawberry', 'Наше Подмосковье']
];

test('доказательная подборка содержит сорта малины и клубники с уникальными карточками', () => {
  for (const [slug, cropKey, name] of expected) {
    const entries = varieties.filter((item) => item.slug === slug);
    assert.equal(entries.length, 1, slug);
    assert.equal(entries[0].cropKey, cropKey, slug);
    assert.equal(entries[0].crop, cropKey === 'raspberry' ? 'Малина' : 'Клубника', slug);
    assert.equal(entries[0].name, name, slug);
    assert.match(entries[0].source, /^https:\/\//, slug);
  }
});

test('проверенные факты в карточках совпадают с первичными публикациями', () => {
  const bySlug = Object.fromEntries(expected.map(([slug]) => [slug, varieties.find((item) => item.slug === slug)]));
  assert.match(bySlug.pshehiba.evidenceNote, /3,99 г.*5,6 г/);
  assert.match(bySlug.patritsiya.evidenceNote, /2,93 г.*3,9 г/);
  assert.match(bySlug.karamelka.evidenceNote.toLowerCase(), /3,8 г.*8,0 г.*среднеранним ремонтантным/);
  assert.match(bySlug.samohval.evidenceNote.toLowerCase(), /5,9 г.*9,1 г.*поздним ремонтантным/);
  assert.match(bySlug.malvina.evidenceNote, /3,0–4,0 балла/);
  assert.match(bySlug.honey.evidenceNote, /3,0–4,0 балла/);
  assert.match(bySlug.kimberli.evidenceNote, /3,0–4,0 балла/);
  assert.match(bySlug.albion.evidenceNote, /4,5–5,0 балла/);
  assert.match(bySlug.tarusa.note, /прямым крепким побегам.*ярко-красные/i);
  assert.equal(bySlug.tarusa.fruitColor, 'red');
  assert.equal(bySlug.tarusa.fruiting, 'summer');
  assert.equal(bySlug.tarusa.period, 'Среднепоздний срок созревания');
  assert.equal(bySlug.tarusa.secondarySource, 'https://vniispk.ru/pages/activities/science-activities/conference-2007/publ-2007-56');
  assert.equal(bySlug.tarusa.additionalSources[0].url, 'https://old.journal-vniispk.ru/pdf/2019/4/46.pdf');
  assert.match(bySlug.lyachka.note, /ярко-красные/);
  assert.match(bySlug.lyachka.evidenceNote, /6–8 г.*3–6 кг с куста/);
  assert.equal(bySlug.lyachka.fruitColor, 'red');
  assert.equal(bySlug.lyachka.fruiting, 'summer');
  assert.equal(bySlug.lyachka.source, 'https://www.vhoz.ru/articles/sad/malina-lyachka-opisanie-sorta-vyrashchivanie-i-ukhod/');
  assert.equal(bySlug.lyachka.secondarySource, 'https://vniispk.ru/docs/unu/12_raspberry.pdf');
  assert.match(bySlug.maroseyka.note, /светло-красн/);
  assert.match(bySlug.maroseyka.evidenceNote, /4–12 г.*4–5 кг с куста/);
  assert.equal(bySlug.maroseyka.fruitColor, 'red');
  assert.equal(bySlug.maroseyka.fruiting, 'summer');
  assert.equal(bySlug.maroseyka.source, 'https://www.opitomnik.ru/files/novie-sorta-malini.pdf');
  assert.equal(bySlug.maroseyka.secondarySource, 'https://vniispk.ru/docs/unu/12_raspberry.pdf');
  for (const fact of ['4,0–4,5 г', 'первой декаде августа', '80–90%', '2,5–3,0 кг с куста', '16 т/га']) {
    assert.ok(bySlug.brilliantovaya.evidenceNote.includes(fact), `Бриллиантовая: ${fact}`);
  }
  assert.equal(bySlug.brilliantovaya.fruitColor, 'red');
  assert.equal(bySlug.brilliantovaya.fruiting, 'remontant');
  assert.equal(bySlug.brilliantovaya.source, 'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-13');
  assert.match(bySlug.elsanta.note, /красные ягоды.*начале летнего сезона/i);
  assert.match(bySlug.elsanta.evidenceNote, /13,1 г.*54,7–73,4 ц\/га/i);
  for (const region of ['Волго-Вятского', 'Северо-Кавказского', 'Западно-Сибирского']) {
    assert.ok(bySlug.elsanta.evidenceNote.includes(region), `Эльсанта: ${region}`);
  }
  assert.equal(bySlug.elsanta.fruiting, 'summer');
  assert.equal(bySlug.elsanta.source, 'https://gossortrf.ru/registry/gosudarstvennyy-reestr-selektsionnykh-dostizheniy-dopushchennykh-k-ispolzovaniyu-tom-1-sorta-rasteni/elsanta-zemlyanika-9610367/');
  assert.match(bySlug.borovitskaya.note, /оранжево-красные/);
  assert.match(bySlug.borovitskaya.evidenceNote, /15–16 г.*11,7 т\/га/i);
  assert.equal(bySlug.borovitskaya.fruiting, 'unknown');
  assert.equal(bySlug.borovitskaya.source, 'https://vstisp.org/vstisp/index.php/11-icetheme/sample-news/1447-borovitskaya');
  assert.match(bySlug['nashe-podmoskove'].evidenceNote, /7–8 г.*30 г.*15–20 т\/га/);
  assert.equal(bySlug['nashe-podmoskove'].fruiting, 'unknown');
  assert.equal(bySlug['nashe-podmoskove'].source, 'https://vstisp.org/vstisp/index.php/component/content/article/11-icetheme/sample-news/1441-nashe-podmoskove');
  assert.match(bySlug.cabrillo.note, /разной длине дня/i);
  assert.match(bySlug.cabrillo.evidenceNote, /32 г/);
  assert.equal(bySlug.cabrillo.fruiting, 'unknown');
  assert.equal(bySlug.cabrillo.fruitingLabel, 'Нейтральный световой день');
  assert.match(bySlug.brilla.note, /ранний урожай.*красно-оранжевых/);
  assert.match(bySlug.magnus.evidenceNote, /10 дней позже сорта Faith/);
  assert.match(bySlug.rumba.note, /ранний урожай.*ярко-красных/);
  assert.match(bySlug.rumba.evidenceNote, /5–6 дней раньше/);
  assert.equal(bySlug.rumba.secondarySource, 'https://www.fresh-forward.nl/en/download/77/rumba-uknew');
  for (const [slug, cropKey] of expected) {
    const copy = [bySlug[slug].name, bySlug[slug].note, ...(bySlug[slug].traits ?? [])].join(' ');
    assert.doesNotMatch(copy.toLowerCase(), /садовая земляника/);
    assert.equal(bySlug[slug].cropKey, cropKey);
  }
  for (const slug of ['pshehiba', 'karamelka', 'samohval', 'patritsiya']) {
    assert.equal(bySlug[slug].fruitColor, 'unknown', slug);
  }
});

test('у новых карточек есть отдельные WebP-изображения своей культуры', async () => {
  for (const [slug, cropKey] of expected) {
    const item = varieties.find((entry) => entry.slug === slug);
    const image = cultivarImage(item);
    assert.match(image.src, /^\/assets\/variety-(?:photo-)?[a-z0-9-]+\.webp$/);
    assert.ok(image.width > 0, `${slug} width`);
    assert.ok(image.height > 0, `${slug} height`);
    const assetUrl = new URL(`../assets/${image.src.split('/').at(-1)}`, import.meta.url);
    assert.ok(existsSync(fileURLToPath(assetUrl)), slug);
    assert.match(image.alt, cropKey === 'raspberry' ? /малины/ : /клубники/);
    const bytes = await readFile(assetUrl);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', slug);
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', slug);
    if (!image.src.includes('/variety-photo-')) {
      assert.equal(bytes.readUInt16LE(26) & 0x3fff, 960, `${slug} width`);
      assert.equal(bytes.readUInt16LE(28) & 0x3fff, 640, `${slug} height`);
    }
  }
});
