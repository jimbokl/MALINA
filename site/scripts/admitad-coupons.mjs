import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './admitad-csv.mjs';
import { fetchFeed, writeSnapshot } from './admitad-feed.mjs';
import { normalizeCoupon } from '../shop-coupons.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const columns = ['id', 'site', 'advcampaign_id', 'description', 'species', 'promocode',
  'gotolink', 'date_start', 'date_end', 'has_affiliate_link'];
const freshnessMs = 36 * 60 * 60 * 1000;

export function buildCouponSnapshot(feeds, now = new Date()) {
  const coupons = [];
  const seen = new Set();
  for (const { source, csv } of feeds) {
    let rows;
    try { rows = parseCsv(csv, columns); }
    catch { continue; }
    for (const row of rows) {
      const id = `${source}-${row.id}`;
      if (seen.has(id)) {
        const position = coupons.findIndex(item => item.id === id);
        if (position >= 0) coupons.splice(position, 1);
        continue;
      }
      seen.add(id);
      const coupon = normalizeCoupon(row, source, now);
      if (coupon) coupons.push(coupon);
    }
  }
  return { checkedAt: now.toISOString(), expiresAt: new Date(now.getTime() + freshnessMs).toISOString(), coupons };
}

async function main() {
  const output = process.env.SHOP_COUPONS_PATH || join(root, 'db', 'public', 'shop-coupons.json');
  const feeds = [];
  for (const [source, envName, campaign] of [
    ['garshinka', 'ADMITAD_COUPONS_URL_GARSHINKA', '21527'],
    ['agrosemfond', 'ADMITAD_COUPONS_URL_AGROSEMFOND', '19919']
  ]) {
    try {
      const value = process.env[envName];
      if (!value || new URL(value).searchParams.get('advcampaigns') !== campaign) throw new Error('missing or wrong campaign');
      feeds.push({ source, csv: await fetchFeed(value) });
    } catch {
      process.stderr.write(`Admitad coupons ${source}: feed unavailable\n`);
    }
  }
  const snapshot = buildCouponSnapshot(feeds);
  await writeSnapshot(output, snapshot);
  process.stdout.write(`Admitad coupons: ${snapshot.coupons.length} reviewed offers from ${feeds.length} feeds\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
