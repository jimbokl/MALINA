import { sourceFor } from './scripts/admitad-sources.mjs';

const productImagePattern = /^\/assets\/shop\/(?:g-)?\d+\.(?:jpg|png|webp)$/;

function secureUrl(value, host) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === host && !url.username && !url.password && !url.port ? url : null;
  } catch { return null; }
}

export function shopSnapshotIsCurrent(snapshot, now = new Date()) {
  if (!snapshot || !Array.isArray(snapshot.products)) return false;
  const checked = Date.parse(snapshot.checkedAt);
  const expires = Date.parse(snapshot.expiresAt);
  const moment = now.getTime();
  return Number.isFinite(checked) && Number.isFinite(expires) && checked <= moment && expires > moment && expires - checked <= 12 * 60 * 60 * 1000;
}

export function shopStockState(snapshot, variants, offers, now = new Date()) {
  if (variants.some(product => offers.has(String(product.id)))) return 'in_stock';
  if (!shopSnapshotIsCurrent(snapshot, now) || !variants.length) return 'unknown';
  const byId = new Map(snapshot.products.filter(product => product?.id != null).map(product => [String(product.id), product]));
  return variants.every(product => byId.get(String(product.id))?.availability === 'out_of_stock')
    ? 'out_of_stock' : 'unknown';
}

export function currentShopOffers(snapshot, manifest, now = new Date()) {
  if (!shopSnapshotIsCurrent(snapshot, now)) return new Map();
  const products = new Map(manifest.map(product => [String(product.id), product]));
  const valid = new Map();
  for (const offer of snapshot.products) {
    if (!offer || !products.has(String(offer.id)) || valid.has(String(offer.id))) continue;
    const product = products.get(String(offer.id));
    const source = sourceFor(product);
    if (!source || (offer.source || 'agrosemfond') !== source.id) continue;
    const affiliate = secureUrl(offer.affiliateUrl, source.affiliateHost);
    const merchant = secureUrl(offer.merchantUrl, source.merchantHost);
    const trackedMerchant = affiliate && secureUrl(affiliate.searchParams.get('ulp'), source.merchantHost);
    if (!affiliate || !merchant || !trackedMerchant || trackedMerchant.href !== merchant.href) continue;
    if (offer.availability !== 'in_stock' || offer.currency !== 'RUB' || !Number.isSafeInteger(offer.priceMinor) || offer.priceMinor <= 0) continue;
    if (typeof offer.name !== 'string' || !offer.name.trim() || offer.name.length > 250) continue;
    const expected = products.get(String(offer.id)).expectedName;
    if (expected && !offer.name.toLocaleLowerCase('ru').replaceAll('ё', 'е').includes(expected.toLocaleLowerCase('ru').replaceAll('ё', 'е'))) continue;
    valid.set(String(offer.id), {
      ...offer,
      affiliateUrl: affiliate.href,
      merchantUrl: merchant.href,
      imagePath: productImagePattern.test(offer.imagePath) ? offer.imagePath : null
    });
  }
  return valid;
}
