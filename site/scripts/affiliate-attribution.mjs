import { createHash } from 'node:crypto';

const sellers = new Set(['agrosemfond', 'garshinka', 'onlinesemena']);
const placements = new Set(['shop_offer', 'cultivar_offer']);
const idPattern = /^[a-z0-9-]{1,80}$/;

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function buildAffiliateAttribution({ pagePath, sellerId, offerId, productId, placement, cultivar }) {
  if (typeof pagePath !== 'string' || !/^\/(?:[a-z0-9-]+\/)*$/.test(pagePath) ||
      !sellers.has(sellerId) || !placements.has(placement) ||
      !idPattern.test(String(offerId)) || !idPattern.test(String(productId)) ||
      (cultivar !== undefined && !idPattern.test(String(cultivar)))) {
    throw new TypeError('Invalid affiliate attribution dimensions');
  }
  const dimensions = [pagePath, sellerId, String(offerId), String(productId), placement, cultivar || ''].join('\u001f');
  const attributionId = `p1_${digest(dimensions).slice(0, 32)}`;
  // Preserve short offer IDs for direct report joins; bound unusually long feed IDs.
  const rawSellerOfferId = `${sellerId}_${offerId}`;
  const sellerOfferId = rawSellerOfferId.length <= 50 ? rawSellerOfferId
    : `${sellerId}_${String(offerId).slice(0, 50 - sellerId.length - 10)}_${digest(`${sellerId}\u001f${offerId}`).slice(0, 8)}`;
  return { attributionId, sellerOfferId, placement };
}

export function buildAffiliateAttributionManifest(entries) {
  const rows = new Map();
  for (const entry of entries) {
    const attribution = buildAffiliateAttribution(entry);
    rows.set(attribution.attributionId, {
      attribution_id: attribution.attributionId,
      page_path: entry.pagePath,
      seller_id: entry.sellerId,
      offer_id: String(entry.offerId),
      product_id: String(entry.productId),
      cta_placement: entry.placement,
      ...(entry.cultivar ? { cultivar: entry.cultivar } : {})
    });
  }
  return [...rows.values()].sort((a, b) => a.attribution_id.localeCompare(b.attribution_id));
}

export function addAffiliateSubIds(affiliateUrl, attribution) {
  const url = new URL(affiliateUrl);
  if (url.protocol !== 'https:' || !/^p1_[a-f0-9]{32}$/.test(attribution.attributionId) ||
      !/^[a-z0-9_-]{1,50}$/.test(attribution.sellerOfferId) || !placements.has(attribution.placement)) {
    throw new TypeError('Invalid affiliate URL or attribution fields');
  }
  url.searchParams.set('subid', attribution.attributionId);
  url.searchParams.set('subid1', attribution.sellerOfferId);
  url.searchParams.set('subid2', attribution.placement);
  return url.toString();
}
