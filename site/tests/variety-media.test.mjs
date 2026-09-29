import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { varieties } from '../data.mjs';
import { cultivarImage, cultivarSupplementalImages, varietyMedia, varietyPhotoSources, varietySupplementalPhotoSources } from '../variety-media.mjs';
import { externalVarietyPhotoReferences } from '../variety-photo-references.mjs';

const assetsDir = new URL('../assets/', import.meta.url);
// The approved image was visually checked: ripe berries are yellow/gold, not red.
const approvedYellowImageSha256 = 'd4bf84d2ee483aa44f5d63120291f0107f41b35cec5e3d7ca756919260d4cb6d';

test('внешние фотоссылки ведут к оригиналам и не считаются правом на публикацию', () => {
  for (const [slug, reference] of Object.entries(externalVarietyPhotoReferences)) {
    assert.ok(varieties.some((variety) => variety.slug === slug), slug);
    assert.match(reference.url, /^https:\/\//, slug);
    assert.doesNotMatch(reference.url, /rhs\.org\.uk/i, slug);
    assert.ok(reference.publisher.trim(), slug);
    assert.equal(varietyPhotoSources[slug], undefined, `${slug}: внешняя ссылка не должна подменять фото сайта`);
  }
});

test('проверенная жёлтая иллюстрация не заменена другим изображением', async () => {
  const bytes = await readFile(new URL('raspberry-yellow-garden.webp', assetsDir));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), approvedYellowImageSha256);
});

test('жёлтоплодные сорта малины используют жёлтое фото или иллюстрацию', () => {
  const yellow = varieties.filter((variety) => variety.cropKey === 'raspberry' && variety.fruitColor === 'yellow');
  assert.ok(yellow.length > 0, 'в каталоге должны быть жёлтоплодные сорта');
  for (const variety of yellow) {
    const image = cultivarImage(variety);
    const expected = variety.slug === 'zheltyy-gigant'
      ? '/assets/variety-photo-yellow-giant-fruit.webp'
      : '/assets/raspberry-yellow-garden.webp';
    assert.equal(image.src, expected, variety.slug);
    assert.match(image.alt, /жёлтой малины/, variety.slug);
    assert.ok(existsSync(fileURLToPath(new URL(image.src.split('/').at(-1), assetsDir))), variety.slug);
  }
});

test('Абрикосовая классифицирована по источнику как жёлтоплодная', () => {
  const apricot = varieties.find((variety) => variety.slug === 'abrikosovaya' && variety.cropKey === 'raspberry');
  assert.ok(apricot);
  assert.equal(apricot.fruitColor, 'yellow');
  assert.equal(cultivarImage(apricot).src, '/assets/raspberry-yellow-garden.webp');
  assert.match(apricot.source, /vniispk\.ru\/pages\/activities\/science-activities\/conference-2008\/publ-2008-13/);
});

test('красная малина не получает жёлтую общую иллюстрацию', () => {
  for (const variety of varieties.filter((item) => item.cropKey === 'raspberry' && item.fruitColor === 'red')) {
    assert.notEqual(cultivarImage(variety).src, '/assets/raspberry-yellow-garden.webp', variety.slug);
  }
});

test('отдельные иллюстрации красных сортов существуют и не используются для жёлтых', () => {
  for (const slug of ['gusar', 'meteor', 'peresvet']) {
    const variety = varieties.find((item) => item.slug === slug && item.cropKey === 'raspberry');
    assert.ok(variety, slug);
    assert.equal(variety.fruitColor, 'red', slug);
    assert.equal(varietyMedia[slug].fruitColor, 'red', slug);
    assert.equal(cultivarImage(variety).src, `/assets/variety-${slug}.webp`, slug);
    assert.ok(existsSync(fileURLToPath(new URL(`variety-${slug}.webp`, assetsDir))), slug);
  }
});

test('фото сорта имеют подтверждённый источник, условия публикации и проверенный файл', async () => {
  const photoSlugs = Object.entries(varietyMedia).filter(([, media]) => media.kind === 'photo').map(([slug]) => slug);
  assert.ok(photoSlugs.length >= 2);
  assert.deepEqual(photoSlugs.sort(), Object.keys(varietyPhotoSources).sort());
  for (const slug of photoSlugs) {
    const media = varietyMedia[slug];
    const source = varietyPhotoSources[slug];
    const variety = varieties.find((item) => item.slug === slug);
    assert.ok(variety, slug);
    assert.equal(source.file, media.file, slug);
    assert.match(source.sourcePage, /^https:\/\/(?:www\.agronauka-sv\.ru\/jour\/article\/view\/883$|commons\.wikimedia\.org\/wiki\/File:|pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC\d+\/(?:#|$)|horticulturejournal\.usamv\.ro\/pdf\/2024\/issue_1\/Art2\.pdf#page=3|jbiochemtech\.com\/storage\/models\/article\/[^/]+\/garden-strawberry-varieties-of-the-all-russian-horticultural-institute-for-breeding-agrotechnology\.pdf#page=[45]$|biosel\.elpub\.ru\/jour\/article\/download\/(?:143\/139#page=4|116\/115#page=9)$|www\.flickr\.com\/photos\/graibeard\/3220923545\/|agroecoinfo\.ru\/STATYI\/2022\/5\/st_525\.pdf#page=5$)/, slug);
    assert.match(source.originalUrl, /^https:\/\/(?:pdfs\.semanticscholar\.org\/9a32\/5dd36827a0a9af4d5e3e8b06c6058312cca2\.pdf$|upload\.wikimedia\.org\/wikipedia\/commons\/|cdn\.ncbi\.nlm\.nih\.gov\/pmc\/|pmc\.ncbi\.nlm\.nih\.gov\/articles\/instance\/11125040\/bin\/plants-13-01419-s001\.zip$|www\.ebi\.ac\.uk\/europepmc\/webservices\/rest\/PMC10305725\/supplementaryFiles$|horticulturejournal\.usamv\.ro\/pdf\/2024\/issue_1\/Art2\.pdf$|jbiochemtech\.com\/storage\/models\/article\/[^/]+\/garden-strawberry-varieties-of-the-all-russian-horticultural-institute-for-breeding-agrotechnology\.pdf$|biosel\.elpub\.ru\/jour\/article\/download\/(?:143\/139|116\/115)$|live\.staticflickr\.com\/3128\/3220923545_c22ae77719_b\.jpg$|mdpi-res\.com\/d_attachment\/(?:foods\/foods-11-00640\/article_deploy\/foods-11-00640|plants\/plants-13-01419\/article_deploy\/plants-13-01419)\.pdf$|agroecoinfo\.ru\/STATYI\/2022\/5\/st_525\.pdf$)/, slug);
    assert.ok(source.identityEvidence.length >= 20, slug);
    assert.match(source.author, /\S{3,}/, slug);
    assert.match(source.license, /^(?:CC(?: BY|0)|Условия журнала)/, slug);
    assert.match(source.licenseUrl, /^https:\/\/(?:creativecommons\.org\/|agroecoinfo\.ru\/TEXT\/RUSSIAN\/journal\.html$)/, slug);
    assert.match(source.originalSha256, /^[0-9a-f]{64}$/, slug);
    if (source.sourcePanelSha256) assert.match(source.sourcePanelSha256, /^[0-9a-f]{64}$/, slug);
    const bytes = await readFile(new URL(source.file, assetsDir));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', slug);
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', slug);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256, slug);
    const image = cultivarImage(variety);
    assert.equal(image.src, `/assets/${source.file}`, slug);
    assert.match(image.alt, /^Фото /, slug);
    assert.match(image.shortCaption, /^Фото сорта/, slug);
    assert.ok(!image.shortCaption.includes('<'), slug);
    assert.match(image.caption, /<a href=/, slug);
    assert.ok(!image.captionText.includes('<'), slug);
    assert.equal(image.width, source.width ?? 960, slug);
    assert.equal(image.height, source.height ?? 640, slug);
  }
});

test('дополнительные снимки сорта имеют отдельный источник и сверенный файл', async () => {
  for (const [slug, source] of Object.entries(varietySupplementalPhotoSources)) {
    const variety = varieties.find((item) => item.slug === slug);
    assert.ok(variety, slug);
    assert.notEqual(cultivarImage(variety).src, `/assets/${source.file}`, 'дополнительный снимок не подменяет главный визуал');
    if (['dzholi', 'malga', 'aniya', 'prelude', 'encore', 'double-gold'].includes(slug)) {
      const patents = { dzholi: 'USPP23126P3', malga: 'USPP28310P3', aniya: 'USPP32221P3', prelude: 'USPP11747P2', encore: 'USPP11746P2', 'double-gold': 'USPP24811P3' };
      assert.equal(source.sourcePage, `https://patents.google.com/patent/${patents[slug]}/en`);
      assert.match(source.originalUrl, /^https:\/\/patentimages\.storage\.googleapis\.com\/[^/]+\/[^/]+\/[^/]+\/[^/]+\/USPP\d+\.pdf$/);
      assert.equal(source.licenseUrl, 'https://www.uspto.gov/terms-use-uspto-websites');
      assert.match(source.identityEvidence, /FIG\. [124].*плод/);
    } else {
      assert.match(source.sourcePage, /^https:\/\/(?:www\.intechopen\.com\/chapters\/73090|www\.agronauka-sv\.ru\/jour\/article\/view\/1761|biosel\.elpub\.ru\/jour\/article\/download\/143\/139#page=4|www\.frontiersin\.org\/journals\/plant-science\/articles\/10\.3389\/fpls\.2016\.01892\/full|pmc\.ncbi\.nlm\.nih\.gov\/articles\/(?:PMC13043038|PMC11043506|PMC8728004)\/|www\.mdpi\.com\/(?:2311-7524\/12\/1\/79|2223-7747\/10\/10\/2071)|openbiotechnologyjournal\.com\/contents\/volumes\/V20\/e18740707455704\/e18740707455704\.pdf#page=5)/, slug);
      assert.match(source.originalUrl, /^https:\/\/(?:cdnintech\.com\/media\/chapter\/73090\/1512345123\/media\/F5\.png|www\.agronauka-sv\.ru\/jour\/article\/download\/1761\/816|biosel\.elpub\.ru\/jour\/article\/download\/143\/139|www\.frontiersin\.org\/journals\/plant-science\/articles\/10\.3389\/fpls\.2016\.01892\/pdf|www\.ebi\.ac\.uk\/europepmc\/webservices\/rest\/PMC13043038\/supplementaryFiles\?inlineImages=true|pdfs\.semanticscholar\.org\/7137\/18200ea61d95ab689e7162ae0327acf4ac01\.pdf|cdn\.ncbi\.nlm\.nih\.gov\/pmc\/blobs\/6df8\/8728004\/f7c27f3aa812\/jkab378f1\.jpg|mdpi-res\.com\/d_attachment\/(?:horticulturae\/horticulturae-12-00079\/article_deploy\/html\/images\/horticulturae-12-00079-g001\.png|plants\/plants-10-02071\/article_deploy\/plants-10-02071\.pdf)|openbiotechnologyjournal\.com\/contents\/volumes\/V20\/e18740707455704\/e18740707455704\.pdf)/, slug);
      assert.match(source.sourcePanelSha256, /^[0-9a-f]{64}$/, slug);
      assert.match(source.license, /^CC BY/, slug);
      assert.match(source.licenseUrl, /^https:\/\/creativecommons\.org\/licenses\/by\//, slug);
      assert.match(source.identityEvidence, /(?:Рисунок|рисунок) [125](?:A|а)?/, slug);
    }
    assert.match(source.originalSha256, /^[0-9a-f]{64}$/, slug);
    assert.match(source.author, /\S{3,}/, slug);
    const bytes = await readFile(new URL(source.file, assetsDir));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', slug);
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', slug);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256, slug);
    const [image] = cultivarSupplementalImages(variety);
    assert.ok(image, slug);
    assert.equal(image.src, `/assets/${source.file}`, slug);
    assert.equal(image.width, source.width, slug);
    assert.equal(image.height, source.height, slug);
    assert.match(image.shortCaption, /^Фото сорта:/, slug);
    assert.match(image.caption, /<a href=/, slug);
  }
});

test('Дарёнка сохраняет иллюстрацию обложки и получает фото гербарного образца', () => {
  const darenka = varieties.find((item) => item.slug === 'darenka');
  assert.ok(darenka);
  assert.equal(cultivarImage(darenka).src, '/assets/variety-darenka.webp');
  assert.match(varietySupplementalPhotoSources.darenka.identityEvidence, /Рисунок 5.*Дарёнка/);
  assert.match(cultivarSupplementalImages(darenka)[0].shortCaption, /гербарного образца с ягодами/);
});

test('Кимберли показывает микрорастения как дополнительное фото без подмены ягод', () => {
  const kimberli = varieties.find((item) => item.slug === 'kimberli');
  assert.ok(kimberli);
  assert.equal(cultivarImage(kimberli).src, '/assets/variety-kimberli.webp');
  assert.match(varietySupplementalPhotoSources.kimberli.identityEvidence, /Рисунок 2.*Kimberly/);
  const [photo] = cultivarSupplementalImages(kimberli);
  assert.match(photo.alt, /микрорастения/);
  assert.doesNotMatch(photo.alt, /ягод/);
});

test('Джоли показывает плоды из патента как дополнительное фото', () => {
  const joly = varieties.find((item) => item.slug === 'dzholi');
  assert.ok(joly);
  assert.equal(cultivarImage(joly).src, '/assets/variety-dzholi.webp');
  const [photo] = cultivarSupplementalImages(joly);
  assert.equal(photo.src, '/assets/variety-photo-joly-patent.webp');
  assert.match(photo.shortCaption, /патентном снимке/);
});

test('Фестивальная сохраняет иллюстрацию обложки, а больные ягоды честно подписаны', () => {
  const festivalnaya = varieties.find((item) => item.slug === 'festivalnaya');
  assert.ok(festivalnaya);
  assert.equal(cultivarImage(festivalnaya).src, '/assets/variety-festivalnaya.webp');
  assert.match(varietySupplementalPhotoSources.festivalnaya.identityEvidence, /панель В.*Фестивальная.*антракноз/);
  const [image] = cultivarSupplementalImages(festivalnaya);
  assert.match(image.alt, /поражённые антракнозом/);
  assert.match(image.shortCaption, /поражённые антракнозом/);
});

test('Соловушка показывает фото цветков после морозного опыта с источником и лицензией', async () => {
  const variety = varieties.find((item) => item.slug === 'solovushka' && item.cropKey === 'strawberry');
  assert.ok(variety);
  assert.equal(cultivarImage(variety).src, '/assets/variety-solovushka.webp');
  const [photo] = cultivarSupplementalImages(variety);
  assert.equal(photo.src, '/assets/variety-photo-solovushka-frost-flowers.webp');
  assert.match(photo.shortCaption, /цветки после морозного эксперимента/);
  assert.match(photo.caption, /intechopen\.com\/chapters\/73090/);
  assert.match(photo.caption, /creativecommons\.org\/licenses\/by\/3\.0/);
  assert.doesNotMatch(photo.alt, /ягод/);
  const bytes = await readFile(new URL('variety-photo-solovushka-frost-flowers.webp', assetsDir));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), varietySupplementalPhotoSources.solovushka.sha256);
});

test('фото Альбы и Азии взяты только из соответствующих подписанных панелей статьи', () => {
  for (const [slug, panel] of [['alba', 'a'], ['aziya', 'b']]) {
    const variety = varieties.find((item) => item.slug === slug && item.cropKey === 'strawberry');
    assert.ok(variety);
    const source = varietyPhotoSources[slug];
    assert.match(source.identityEvidence, new RegExp(`панель ${panel}`));
    assert.match(source.captionChange, new RegExp(`панель ${panel}`));
    assert.match(cultivarImage(variety).captionText, new RegExp(`панель ${panel}`));
    assert.equal(cultivarImage(variety).width, source.width);
  }
});

test('Кембридж Фаворит использует здоровые ягоды с подписанной панели Б, а Фестивальная остаётся иллюстрацией', () => {
  const source = varietyPhotoSources['cambridge-favourite'];
  assert.match(source.identityEvidence, /панель Б.*Cambridge Favourite.*здоровые красные ягоды/);
  assert.match(source.captionChange, /панель Б/);
  assert.equal(varietyMedia['cambridge-favourite'].kind, 'photo');
  assert.notEqual(varietyMedia.festivalnaya.kind, 'photo');
});

test('фото Хонея точно помечено как снимок незрелых ягод', () => {
  const honey = varieties.find((item) => item.slug === 'honey');
  assert.ok(honey);
  const image = cultivarImage(honey);
  assert.match(image.alt, /незрелые ягоды/);
  assert.match(image.captionText, /незрелые ягоды/);
});

test('фото Польки взято только из подписанной панели научной статьи', () => {
  const polka = varieties.find((item) => item.slug === 'polka' && item.cropKey === 'raspberry');
  assert.ok(polka);
  const source = varietyPhotoSources.polka;
  assert.match(source.identityEvidence, /панель C.*Polka/);
  assert.match(source.transformation, /панель C/);
  const image = cultivarImage(polka);
  assert.match(image.captionText, /панель C, кадрировано/);
});

test('снимок Атланта подписан сортом и показывает красные ягоды', () => {
  const atlant = varieties.find((item) => item.slug === 'atlant' && item.cropKey === 'raspberry');
  assert.ok(atlant);
  assert.equal(atlant.fruitColor, 'red');
  assert.match(varietyPhotoSources.atlant.identityEvidence, /Атлант.*красные/);
  assert.equal(cultivarImage(atlant).src, '/assets/variety-photo-atlant.webp');
});

test('снимок Херитейдж подписан сортом и лицензирован на Flickr', () => {
  const heritage = varieties.find((item) => item.slug === 'heritage' && item.cropKey === 'raspberry');
  assert.ok(heritage);
  assert.equal(heritage.fruitColor, 'red');
  assert.match(varietyPhotoSources.heritage.identityEvidence, /Heritage.*CC BY-SA 2\.0/);
  assert.equal(cultivarImage(heritage).src, '/assets/variety-photo-heritage.webp');
});

test('фото Альбиона взято из подписанной панели со спелыми ягодами', () => {
  const albion = varieties.find((item) => item.slug === 'albion' && item.cropKey === 'strawberry');
  assert.ok(albion);
  const source = varietyPhotoSources.albion;
  assert.match(source.identityEvidence, /Albion.*B/);
  assert.match(source.transformation, /панель B/);
  assert.match(cultivarImage(albion).captionText, /панель B/);
});

test('пять фото сортов ФНЦ соответствуют подписанным рисункам статьи', () => {
  for (const [slug, figure] of [['slavutich', 3], ['vityaz', 4], ['tsaritsa', 5], ['alfa', 6], ['bereginya', 7]]) {
    const variety = varieties.find((item) => item.slug === slug && item.cropKey === 'strawberry');
    assert.ok(variety, slug);
    const source = varietyPhotoSources[slug];
    assert.match(source.identityEvidence, new RegExp(`Figure ${figure}`), slug);
    assert.match(source.captionChange, new RegExp(`рисунок ${figure}`), slug);
    assert.match(cultivarImage(variety).captionText, new RegExp(`рисунок ${figure}`), slug);
    assert.equal(source.originalSha256, '6b5585cd4373f9727005093e4f87279ad3237f4075a9c9b0476441bfd81962ac', slug);
  }
});
