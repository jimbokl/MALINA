// Explicit cultivar + crop mapping: raspberry Polka and strawberry Polka are different records.
// Provenance and publication scope: docs/SOURCES.md, «Иллюстрации карточек сортов».
export const varietyMedia = Object.freeze({
  polka: { file: 'variety-polka.webp', crop: 'raspberry' },
  'joan-j': { file: 'variety-joan-j.webp', crop: 'raspberry' },
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
    alt: `ИИ-иллюстрация ${variety.cropKey === 'raspberry' ? 'малины' : 'садовой земляники'} к карточке «${variety.name}»`,
    caption: 'ИИ-иллюстрация · не фотография сорта'
  };
}
