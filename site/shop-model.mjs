const productImagePattern = /^\/assets\/shop\/\d+\.(?:jpg|png|webp)$/;

function secureUrl(value, host) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === host && !url.username && !url.password && !url.port ? url : null;
  } catch { return null; }
}

export function currentShopOffers(snapshot, manifest, now = new Date()) {
  if (!snapshot || !Array.isArray(snapshot.products)) return new Map();
  const checked = Date.parse(snapshot.checkedAt);
  const expires = Date.parse(snapshot.expiresAt);
  const moment = now.getTime();
  if (!Number.isFinite(checked) || !Number.isFinite(expires) || checked > moment || expires <= moment || expires - checked > 36 * 60 * 60 * 1000) return new Map();
  const products = new Map(manifest.map(product => [String(product.id), product]));
  const valid = new Map();
  for (const offer of snapshot.products) {
    if (!offer || !products.has(String(offer.id)) || valid.has(String(offer.id))) continue;
    const affiliate = secureUrl(offer.affiliateUrl, 'rzekl.com');
    const merchant = secureUrl(offer.merchantUrl, 'agrosemfond.ru');
    const trackedMerchant = affiliate && secureUrl(affiliate.searchParams.get('ulp'), 'agrosemfond.ru');
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
