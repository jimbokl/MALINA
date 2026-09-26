// Explicit cultivar + crop mapping: raspberry Polka and strawberry Polka are different records.
// Provenance and publication scope: docs/SOURCES.md, «Иллюстрации карточек сортов».
export const varietyMedia = Object.freeze({
  gusar: { file: 'raspberry-garden.webp', crop: 'raspberry', generic: true },
  polka: { file: 'variety-polka.webp', crop: 'raspberry' },
  'joan-j': { file: 'variety-joan-j.webp', crop: 'raspberry' },
  aziya: { file: 'variety-aziya.webp', crop: 'strawberry' },
  murano: { file: 'variety-murano.webp', crop: 'strawberry' },
  alba: { file: 'variety-alba.webp', crop: 'strawberry' },
  'cambridge-favourite': { file: 'variety-cambridge-favourite.webp', crop: 'strawberry' },
  elan: { file: 'variety-elan.webp', crop: 'strawberry' }
});

export function cultivarImage(variety) {
  const media = varietyMedia[variety.slug];
  if (!media || media.crop !== variety.cropKey) {
    throw new Error(`Missing or mismatched cultivar illustration: ${variety.slug}`);
  }
  return {
    src: `/assets/${media.file}`,
    width: 960,
    height: 640,
    alt: media.generic ? 'ИИ-иллюстрация малинового сада; сорт Гусар на изображении не показан' : `ИИ-иллюстрация ${variety.cropKey === 'raspberry' ? 'малины' : 'садовой земляники'} к карточке «${variety.name}»`,
    caption: media.generic ? 'ИИ-иллюстрация малинового сада · не изображение сорта' : 'ИИ-иллюстрация · не фотография сорта'
  };
}
