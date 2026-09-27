// Explicit cultivar + crop mapping: raspberry Polka and strawberry Polka are different records.
// Provenance and publication scope: docs/SOURCES.md, «Иллюстрации карточек сортов».
export const varietyMedia = Object.freeze({
  gusar: { file: 'variety-gusar.webp', crop: 'raspberry', fruitColor: 'red' },
  atlant: { file: 'variety-atlant.webp', crop: 'raspberry', fruitColor: 'red' },
  gerakl: { file: 'variety-gerakl.webp', crop: 'raspberry', fruitColor: 'red' },
  meteor: { file: 'variety-meteor.webp', crop: 'raspberry', fruitColor: 'red' },
  peresvet: { file: 'variety-peresvet.webp', crop: 'raspberry', fruitColor: 'red' },
  polana: { file: 'variety-polana.webp', crop: 'raspberry', fruitColor: 'red' },
  polka: { file: 'variety-polka.webp', crop: 'raspberry', fruitColor: 'red' },
  'joan-j': { file: 'variety-joan-j.webp', crop: 'raspberry', fruitColor: 'red' },
  pshehiba: { file: 'variety-pshehiba.webp', crop: 'raspberry' },
  karamelka: { file: 'variety-karamelka.webp', crop: 'raspberry' },
  samohval: { file: 'variety-samohval.webp', crop: 'raspberry' },
  patritsiya: { file: 'variety-patritsiya.webp', crop: 'raspberry' },
  tarusa: { file: 'variety-tarusa.webp', crop: 'raspberry', fruitColor: 'red' },
  lyachka: { file: 'variety-lyachka.webp', crop: 'raspberry', fruitColor: 'red' },
  maroseyka: { file: 'variety-maroseyka.webp', crop: 'raspberry', fruitColor: 'red' },
  brilliantovaya: { file: 'variety-brilliantovaya.webp', crop: 'raspberry', fruitColor: 'red' },
  pohvalinka: { file: 'variety-pohvalinka.webp', crop: 'raspberry', fruitColor: 'red' },
  salyut: { file: 'variety-salyut.webp', crop: 'raspberry', fruitColor: 'red' },
  'yubileinaya-kulikova': { file: 'variety-yubileinaya-kulikova.webp', crop: 'raspberry', fruitColor: 'red' },
  arisha: { file: 'variety-arisha.webp', crop: 'raspberry', fruitColor: 'red' },
  aziya: { file: 'variety-aziya.webp', crop: 'strawberry' },
  festivalnaya: { file: 'variety-festivalnaya.webp', crop: 'strawberry' },
  murano: { file: 'variety-murano.webp', crop: 'strawberry' },
  alba: { file: 'variety-alba.webp', crop: 'strawberry' },
  'cambridge-favourite': { file: 'variety-cambridge-favourite.webp', crop: 'strawberry' },
  elan: { file: 'variety-elan.webp', crop: 'strawberry' },
  tsaritsa: { file: 'variety-tsaritsa.webp', crop: 'strawberry' },
  bereginya: { file: 'variety-bereginya.webp', crop: 'strawberry' },
  kleri: { file: 'variety-kleri.webp', crop: 'strawberry' },
  aprika: { file: 'variety-aprika.webp', crop: 'strawberry' },
  dzholi: { file: 'variety-dzholi.webp', crop: 'strawberry' },
  siriya: { file: 'variety-siriya.webp', crop: 'strawberry' },
  malga: { file: 'variety-malga.webp', crop: 'strawberry' },
  aniya: { file: 'variety-aniya.webp', crop: 'strawberry' },
  malvina: { file: 'variety-malvina.webp', crop: 'strawberry' },
  albion: { file: 'variety-albion.webp', crop: 'strawberry' },
  honey: { file: 'variety-honey.webp', crop: 'strawberry' },
  kimberli: { file: 'variety-kimberli.webp', crop: 'strawberry' },
  cabrillo: { file: 'variety-cabrillo.webp', crop: 'strawberry' },
  brilla: { file: 'variety-brilla.webp', crop: 'strawberry' },
  magnus: { file: 'variety-magnus.webp', crop: 'strawberry' },
  rumba: { file: 'variety-rumba.webp', crop: 'strawberry' },
  elsanta: { file: 'variety-elsanta.webp', crop: 'strawberry' },
  borovitskaya: { file: 'variety-borovitskaya.webp', crop: 'strawberry' },
  'nashe-podmoskove': { file: 'variety-nashe-podmoskovye.webp', crop: 'strawberry' },
  darenka: { file: 'variety-darenka.webp', crop: 'strawberry' },
  'zenga-zengana': { file: 'variety-zenga-zengana.webp', crop: 'strawberry' },
  'desnyanka-kokinskaya': { file: 'variety-desnyanka-kokinskaya.webp', crop: 'strawberry' },
  vityaz: { file: 'variety-vityaz.webp', crop: 'strawberry' },
  slavutich: { file: 'variety-slavutich.webp', crop: 'strawberry' },
  rusich: { file: 'variety-rusich.webp', crop: 'strawberry' },
  alfa: { file: 'variety-alfa.webp', crop: 'strawberry' },
  solovushka: { file: 'variety-solovushka.webp', crop: 'strawberry' }
});

const genericRaspberryMedia = Object.freeze({
  red: { file: 'raspberry-garden.webp', crop: 'raspberry', fruitColor: 'red', generic: true },
  yellow: { file: 'raspberry-yellow-garden.webp', crop: 'raspberry', fruitColor: 'yellow', generic: true }
});
const genericStrawberryMedia = Object.freeze({
  file: 'strawberry-garden.webp', crop: 'strawberry', generic: true
});

export function cultivarImage(variety) {
  const media = varietyMedia[variety.slug] ?? (variety.cropKey === 'raspberry'
    ? genericRaspberryMedia[variety.fruitColor === 'yellow' ? 'yellow' : 'red']
    : variety.cropKey === 'strawberry' ? genericStrawberryMedia : undefined);
  if (!media || media.crop !== variety.cropKey) {
    throw new Error(`Missing or mismatched cultivar illustration: ${variety.slug}`);
  }
  if (variety.cropKey === 'raspberry' && (variety.fruitColor === 'red' || variety.fruitColor === 'yellow') && media.fruitColor !== variety.fruitColor) {
    throw new Error(`Raspberry fruit color and illustration differ: ${variety.slug}`);
  }
  const subject = variety.cropKey === 'strawberry'
    ? 'клубники'
    : variety.fruitColor === 'yellow' ? 'жёлтой малины' : 'малины';
  return {
    src: `/assets/${media.file}`,
    width: 960,
    height: 640,
    alt: `Иллюстрация ${subject} для карточки «${variety.name}»`,
    caption: `Иллюстрация ${subject}`
  };
}
