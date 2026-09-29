import { raspberryDescriptionsA, raspberryAdditionalSourcesA } from './variety-descriptions-raspberry-a.mjs';
import { raspberryDescriptionsB, raspberryAdditionalSourcesB } from './variety-descriptions-raspberry-b.mjs';
import { strawberryDescriptionsA, strawberryAdditionalSourcesA } from './variety-descriptions-strawberry-a.mjs';
import { strawberryDescriptionsB } from './variety-descriptions-strawberry-b.mjs';

export const varietyDescriptions = Object.freeze({
  ...raspberryDescriptionsA,
  ...raspberryDescriptionsB,
  ...strawberryDescriptionsA,
  ...strawberryDescriptionsB
});

export const varietyDescriptionSources = Object.freeze({
  ...raspberryAdditionalSourcesA,
  ...raspberryAdditionalSourcesB,
  ...strawberryAdditionalSourcesA
});
