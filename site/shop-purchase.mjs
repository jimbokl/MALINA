import { sourceFor } from './scripts/admitad-sources.mjs';

const MATERIAL_FIELDS = ['rootSystem', 'plantingType', 'packaging', 'packageType', 'material'];
const MATERIAL_LABELS = new Map([
  ['зкс', 'ЗКС'], ['закрытая корневая система', 'ЗКС'],
  ['окс', 'ОКС'], ['открытая корневая система', 'ОКС'],
  ['frigo', 'Frigo'], ['фриго', 'Frigo'],
  ['p9', 'P9'], ['кассета', 'Кассета'], ['кассетная ячейка', 'Кассета']
]);

function quantityFromName(name) {
  if (typeof name !== 'string') return null;
  if (/(?<![\p{L}\p{N}])(?:семен(?:а|и|ам|ами|ах)|семя|семян)(?![\p{L}\p{N}])/iu.test(name)) return null;
  const matches = [...name.matchAll(/(?<![\p{L}\p{N}])(\d+)\s*(?:шт(?![\p{L}\p{N}])\.?|штук(?![\p{L}\p{N}])|штуки(?![\p{L}\p{N}])|саженец(?![\p{L}\p{N}])|саженца(?![\p{L}\p{N}])|саженцев(?![\p{L}\p{N}])|растение(?![\p{L}\p{N}])|растения(?![\p{L}\p{N}])|растений(?![\p{L}\p{N}]))/giu)];
  if (matches.length !== 1) return null;
  const count = Number(matches[0][1]);
  return Number.isSafeInteger(count) && count > 0 ? count : null;
}

function materialFromFields(offer) {
  for (const field of MATERIAL_FIELDS) {
    const value = offer?.[field];
    if (typeof value !== 'string') continue;
    const key = value.trim().toLocaleLowerCase('ru-RU').replace(/\s+/gu, ' ');
    if (MATERIAL_LABELS.has(key)) return MATERIAL_LABELS.get(key);
  }
  if (typeof offer?.name === 'string') {
    for (const [token, label] of [
      ['зкс', 'ЗКС'], ['окс', 'ОКС'], ['frigo', 'Frigo'], ['фриго', 'Frigo'],
      ['p9', 'P9'], ['р9', 'P9'], ['кассета', 'Кассета']
    ]) {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
      if (new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu').test(offer.name)) return label;
    }
  }
  return null;
}

export function purchaseFacts(offer) {
  const quantity = quantityFromName(offer?.name);
  const price = offer?.priceMinor;
  return {
    quantityLabel: quantity === null ? null : `${quantity} шт.`,
    materialLabel: materialFromFields(offer),
    unitPriceMinor: quantity !== null && Number.isSafeInteger(price) && price > 0
      ? Math.round(price / quantity) : null
  };
}

export function sellerSummary(offers) {
  const sellers = new Map();
  for (const offer of Array.isArray(offers) ? offers : []) {
    if (!offer || typeof offer !== 'object') continue;
    const source = sourceFor(offer);
    if (source) sellers.set(source.id, source.seller);
  }
  return [...sellers.values()];
}
