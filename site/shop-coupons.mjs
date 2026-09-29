import { admitadSources } from './scripts/admitad-sources.mjs';

// Keep this short list editorially reviewed: the feeds also contain old and
// unrelated store-wide promotions, including a 2021 seasonal campaign.
export const couponSelection = Object.freeze({
  garshinka: new Map([
    ['851479', '5000 бонусов за подписку на рассылку'],
    ['248418', 'Бонусы за заказ']
  ]),
  agrosemfond: new Map([
    ['495859', 'Подарок к первому заказу'],
    ['338256', 'Скидка по сумме заказа'],
    ['334829', 'Скидка постоянным покупателям']
  ])
});

function secureUrl(value, host) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === host && !url.username &&
      !url.password && !url.port ? url : null;
  } catch { return null; }
}

function dateValue(value) {
  if (!value || value === 'None') return null;
  if (!/^\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2}:\d{2})?$/.test(value)) return NaN;
  return Date.parse(value.replace(' ', 'T') + 'Z');
}

export function normalizeCoupon(row, sourceId, now = new Date()) {
  const source = admitadSources[sourceId];
  const approvedTitle = couponSelection[sourceId]?.get(String(row.id));
  if (!source || !approvedTitle || String(row.advcampaign_id) !== String(sourceId === 'garshinka' ? 21527 : 19919)) return null;
  if (row.species !== 'action' || row.promocode !== 'Not required' || row.has_affiliate_link !== 'true') return null;
  const site = secureUrl(row.site, source.merchantHost);
  const affiliate = secureUrl(row.gotolink, source.affiliateHost);
  if (!site || !affiliate || !affiliate.pathname.startsWith('/g/')) return null;
  const start = dateValue(row.date_start);
  const end = dateValue(row.date_end);
  if (Number.isNaN(start) || Number.isNaN(end) || (start && start > now.getTime()) || (end && end < now.getTime())) return null;
  const description = String(row.description || '').replace(/<[^>]*>/g, '').replace(/\r/g, '').trim();
  if (description.length < 12 || description.length > 3000) return null;
  return { id: `${sourceId}-${row.id}`, source: sourceId, seller: source.seller,
    title: approvedTitle, description, affiliateUrl: affiliate.href,
    dateEnd: end ? new Date(end).toISOString() : null };
}

export function currentCoupons(snapshot, now = new Date()) {
  if (!snapshot || !Array.isArray(snapshot.coupons)) return [];
  const checked = Date.parse(snapshot.checkedAt);
  const expires = Date.parse(snapshot.expiresAt);
  if (!Number.isFinite(checked) || !Number.isFinite(expires) ||
      checked > now.getTime() || expires <= now.getTime() ||
      expires - checked > 12 * 60 * 60 * 1000) return [];
  const seen = new Set();
  return snapshot.coupons.filter(coupon => {
    if (!coupon || seen.has(coupon.id)) return false;
    seen.add(coupon.id);
    const [sourceId, id] = String(coupon.id).split('-');
    const source = admitadSources[sourceId];
    const url = source && secureUrl(coupon.affiliateUrl, source.affiliateHost);
    return Boolean(source && couponSelection[sourceId]?.get(id) === coupon.title &&
      coupon.seller === source.seller && typeof coupon.description === 'string' &&
      coupon.description.length >= 12 && url?.pathname.startsWith('/g/') &&
      (!coupon.dateEnd || (Number.isFinite(Date.parse(coupon.dateEnd)) && Date.parse(coupon.dateEnd) >= now.getTime())));
  });
}
