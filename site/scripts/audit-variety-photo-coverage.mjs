import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { varieties } from '../data.mjs';
import { cultivarImage, cultivarSupplementalImages, varietyMedia, varietyPhotoSources, varietySupplementalPhotoSources } from '../variety-media.mjs';
import { shopVarietyPhotoIds } from '../shop-variety-photos.mjs';

const assetUrl = new URL('../assets/', import.meta.url);

function hasAsset(file) {
  return Boolean(file) && existsSync(fileURLToPath(new URL(file, assetUrl)));
}

export function auditVarietyPhotoCoverage() {
  const rows = varieties.map(variety => {
    const hero = cultivarImage(variety);
    const media = varietyMedia[variety.slug];
    const heroSource = varietyPhotoSources[variety.slug];
    const supplementalSource = varietySupplementalPhotoSources[variety.slug];
    const supplemental = cultivarSupplementalImages(variety);
    const verifiedHero = media?.kind === 'photo'
      && heroSource?.file === media.file
      && hasAsset(media.file);
    const verifiedSupplemental = Boolean(supplementalSource)
      && supplemental.length > 0
      && supplemental[0].src === `/assets/${supplementalSource.file}`
      && hasAsset(supplementalSource.file);
    return {
      slug: variety.slug,
      name: variety.name,
      crop: variety.cropKey,
      verifiedHero,
      verifiedSupplemental,
      verifiedPhoto: verifiedHero || verifiedSupplemental,
      sellerFeedPhotoCandidate: Boolean(shopVarietyPhotoIds[variety.slug]),
      heroFileExists: hasAsset(hero.src.split('/').at(-1))
    };
  });
  const tally = subset => ({
    total: subset.length,
    verifiedHero: subset.filter(row => row.verifiedHero).length,
    verifiedSupplementalOnly: subset.filter(row => !row.verifiedHero && row.verifiedSupplemental).length,
    verifiedPhoto: subset.filter(row => row.verifiedPhoto).length,
    sellerFeedPhotoCandidatesWithoutVerifiedPhoto: subset.filter(row => !row.verifiedPhoto && row.sellerFeedPhotoCandidate).length,
    missingVerifiedPhoto: subset.filter(row => !row.verifiedPhoto).length
  });
  return {
    all: tally(rows),
    raspberry: tally(rows.filter(row => row.crop === 'raspberry')),
    strawberry: tally(rows.filter(row => row.crop === 'strawberry')),
    missingVerifiedPhoto: rows.filter(row => !row.verifiedPhoto),
    missingAnyPhotoCandidate: rows.filter(row => !row.verifiedPhoto && !row.sellerFeedPhotoCandidate),
    missingHeroFile: rows.filter(row => !row.heroFileExists)
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const report = auditVarietyPhotoCoverage();
  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    for (const crop of ['all', 'raspberry', 'strawberry']) {
      const tally = report[crop];
      process.stdout.write(`${crop}: ${tally.verifiedPhoto}/${tally.total} verified real cultivar photos; ${tally.verifiedHero} cover, ${tally.verifiedSupplementalOnly} supplemental only; ${tally.sellerFeedPhotoCandidatesWithoutVerifiedPhoto} seller feed candidates; ${tally.missingVerifiedPhoto} missing\n`);
    }
    for (const crop of ['raspberry', 'strawberry']) {
      const missing = report.missingVerifiedPhoto.filter(row => row.crop === crop);
      process.stdout.write(`${crop} missing: ${missing.map(row => row.name).join(', ')}\n`);
    }
    if (report.missingHeroFile.length) process.stderr.write(`Missing hero asset files: ${report.missingHeroFile.map(row => row.slug).join(', ')}\n`);
  }
  if (report.missingHeroFile.length) process.exitCode = 1;
}
