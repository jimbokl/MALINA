import { sourceFor } from './scripts/admitad-sources.mjs';
import { matchesExpectedName } from './shop-identity.mjs';

const productImagePattern = /^\/assets\/shop\/(?:g-)?\d+\.(?:jpg|png|webp)$/;

function secureUrl(value, host) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === host && !url.username && !url.password && !url.port ? url : null;
  } catch { return null; }
}

function uniqueSnapshotProducts(snapshot) {
  const products = new Map();
  const duplicates = new Set();
  for (const product of snapshot.products) {
    if (product?.id == null) continue;
    const id = String(product.id);
    if (products.has(id)) duplicates.add(id);
    products.set(id, product);
  }
  for (const id of duplicates) products.delete(id);
  return products;
}

export function shopSnapshotIsCurrent(snapshot, now = new Date()) {
  if (!snapshot || !Array.isArray(snapshot.products)) return false;
  const checked = Date.parse(snapshot.checkedAt);
  const expires = Date.parse(snapshot.expiresAt);
  const moment = now.getTime();
  return Number.isFinite(checked) && Number.isFinite(expires) && checked <= moment && expires > moment && expires - checked <= 12 * 60 * 60 * 1000;
}

export function shopStockState(snapshot, variants, offers, now = new Date()) {
  if (!shopSnapshotIsCurrent(snapshot, now) || !variants.length) return 'unknown';
  if (variants.some(product => offers.has(String(product.id)))) return 'in_stock';
  const byId = uniqueSnapshotProducts(snapshot);
  return variants.every(product => {
    const entry = byId.get(String(product.id));
    return entry?.availability === 'out_of_stock'
      && (entry.source || 'agrosemfond') === sourceFor(product)?.id
      && (!product.expectedName || matchesExpectedName(entry.name, product.expectedName));
  })
    ? 'out_of_stock' : 'unknown';
}

export function currentShopOffers(snapshot, manifest, now = new Date()) {
  if (!shopSnapshotIsCurrent(snapshot, now)) return new Map();
  const products = new Map(manifest.map(product => [String(product.id), product]));
  const valid = new Map();
  for (const offer of uniqueSnapshotProducts(snapshot).values()) {
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
    if (expected && !matchesExpectedName(offer.name, expected)) continue;
    valid.set(String(offer.id), {
      ...offer,
      affiliateUrl: affiliate.href,
      merchantUrl: merchant.href,
      imagePath: productImagePattern.test(offer.imagePath) ? offer.imagePath : null
    });
  }
  return valid;
}
