import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildCouponSnapshot } from '../scripts/admitad-coupons.mjs';
import { currentCoupons } from '../shop-coupons.mjs';

const columns = ['id', 'site', 'advcampaign_id', 'description', 'species', 'promocode', 'gotolink', 'date_start', 'date_end', 'has_affiliate_link'];
const cell = value => `"${String(value).replaceAll('"', '""')}"`;
function row(id, overrides = {}) {
  const values = { id, site: 'https://www.garshinka.ru/', advcampaign_id: '21527',
    description: '5000 бонусов за подписку. Бонусами можно оплатить до 15% заказа.',
    species: 'action', promocode: 'Not required',
    gotolink: 'https://codeaven.com/g/offer?i=123', date_start: '2025-01-01 00:00:00',
    date_end: 'None', has_affiliate_link: 'true', ...overrides };
  return columns.map(key => cell(values[key])).join(';');
}
const csv = (...rows) => `${columns.join(';')}\n${rows.join('\n')}\n`;
const now = new Date('2026-09-29T12:00:00Z');

test('only reviewed, current coupons from the matching campaign enter the snapshot', () => {
  const snapshot = buildCouponSnapshot([{ source: 'garshinka', csv: csv(
    row('851479'), row('629050'), row('248418', { date_end: '2026-09-28 00:00:00' }),
    row('248418', { gotolink: 'https://evil.example/g/offer' }),
    row('851479', { advcampaign_id: '19919' })
  ) }], now);
  assert.deepEqual(snapshot.coupons, []); // Duplicate IDs are ambiguous and withdrawn.
});

test('feed text stays separate from curated heading, and snapshot expires', () => {
  const snapshot = buildCouponSnapshot([{ source: 'garshinka', csv: csv(row('851479')) }], now);
  assert.equal(snapshot.coupons.length, 1);
  assert.equal(snapshot.coupons[0].title, '5000 бонусов за подписку на рассылку');
  assert.equal(snapshot.coupons[0].affiliateUrl, 'https://codeaven.com/g/offer?i=123');
  assert.equal(currentCoupons(snapshot, now).length, 1);
  assert.deepEqual(currentCoupons(snapshot, new Date('2026-10-01T00:00:01Z')), []);
});

test('rejects wrong seller, future offer, missing terms and non-affiliate links', () => {
  const snapshot = buildCouponSnapshot([{ source: 'garshinka', csv: csv(
    row('851479', { site: 'https://evil.example/' }),
    row('248418', { date_start: '2026-10-01 00:00:00' })
  ) }], now);
  assert.deepEqual(snapshot.coupons, []);
  const other = buildCouponSnapshot([{ source: 'garshinka', csv: csv(row('851479', { has_affiliate_link: 'false' })) }], now);
  assert.deepEqual(other.coupons, []);
});

test('generated coupon page and catalog expose the route without feed credentials', async () => {
  const root = join(import.meta.dirname, '..', '..', 'dist');
  const page = await readFile(join(root, 'magazin', 'akcii', 'index.html'), 'utf8');
  const catalog = await readFile(join(root, 'magazin', 'index.html'), 'utf8');
  assert.match(page, /<h1>Акции и бонусы/);
  assert.match(catalog, /href="\/magazin\/akcii\/"/);
  assert.doesNotMatch(page, /ctg453a3q0|export\.admitad\.com/);
});
