// Explicit cultivar + crop mapping: raspberry Polka and strawberry Polka are different records.
// Provenance and publication scope: docs/SOURCES.md, «Иллюстрации карточек сортов».
export const varietyMedia = Object.freeze({
  gusar: { file: 'raspberry-garden.webp', crop: 'raspberry', generic: true },
  polka: { file: 'variety-polka.webp', crop: 'raspberry' },
  'joan-j': { file: 'variety-joan-j.webp', crop: 'raspberry' },
  aziya: { file: 'variety-aziya.webp', crop: 'strawberry' },
  festivalnaya: { file: 'variety-festivalnaya.webp', crop: 'strawberry' },
  murano: { file: 'variety-murano.webp', crop: 'strawberry' },
  alba: { file: 'variety-alba.webp', crop: 'strawberry' },
  'cambridge-favourite': { file: 'variety-cambridge-favourite.webp', crop: 'strawberry' },
  elan: { file: 'variety-elan.webp', crop: 'strawberry' }
});

const genericRaspberryMedia = Object.freeze({
  red: { file: 'raspberry-garden.webp', crop: 'raspberry', fruitColor: 'red', generic: true },
  yellow: { file: 'raspberry-yellow-garden.webp', crop: 'raspberry', fruitColor: 'yellow', generic: true }
});

export function cultivarImage(variety) {
  const media = varietyMedia[variety.slug] ?? (variety.cropKey === 'raspberry'
    ? genericRaspberryMedia[variety.fruitColor === 'yellow' ? 'yellow' : 'red']
    : undefined);
  if (!media || media.crop !== variety.cropKey) {
    throw new Error(`Missing or mismatched cultivar illustration: ${variety.slug}`);
  }
  if (variety.cropKey === 'raspberry' && variety.fruitColor === 'yellow' && media.fruitColor !== 'yellow') {
    throw new Error(`Yellow raspberry has a non-yellow illustration: ${variety.slug}`);
  }
  const subject = variety.cropKey === 'strawberry'
    ? 'садовой земляники'
    : variety.fruitColor === 'yellow' ? 'жёлтой малины' : 'малины';
  return {
    src: `/assets/${media.file}`,
    width: 960,
    height: 640,
    alt: `Иллюстрация ${subject} для карточки «${variety.name}»`,
    caption: `Иллюстрация ${subject}`
  };
}
