import test from 'node:test';
import assert from 'node:assert/strict';
import { addAffiliateSubIds, buildAffiliateAttribution, buildAffiliateAttributionManifest } from '../scripts/affiliate-attribution.mjs';

const dimensions = { pagePath: '/magazin/malina-gusar/', sellerId: 'garshinka', offerId: 'g-123', productId: 'malina-gusar', placement: 'shop_offer', cultivar: 'gusar' };

test('placement IDs are deterministic, dimension-specific, bounded, and manifest excludes affiliate destinations', () => {
  const one = buildAffiliateAttribution(dimensions);
  assert.deepEqual(one, buildAffiliateAttribution({ ...dimensions }));
  assert.notEqual(one.attributionId, buildAffiliateAttribution({ ...dimensions, sellerId: 'agrosemfond' }).attributionId);
  assert.match(one.attributionId, /^p1_[a-f0-9]{32}$/);
  assert.ok(one.attributionId.length <= 50);
  assert.ok(one.sellerOfferId.length <= 50);
  const rows = buildAffiliateAttributionManifest([{ ...dimensions, affiliateUrl: 'https://private.example/?token=secret' }]);
  assert.equal(rows[0].attribution_id, one.attributionId);
  assert.equal(rows[0].page_path, dimensions.pagePath);
  assert.doesNotMatch(JSON.stringify(rows), /affiliateUrl|private\.example|secret/);
  const sellers = ['agrosemfond', 'garshinka', 'onlinesemena'].map((sellerId, index) => ({
    ...dimensions, sellerId, offerId: `offer-${index}`
  }));
  const allSellerRows = buildAffiliateAttributionManifest(sellers);
  assert.deepEqual(allSellerRows.map(row => row.seller_id).sort(), ['agrosemfond', 'garshinka', 'onlinesemena']);
  assert.equal(new Set(allSellerRows.map(row => row.attribution_id)).size, 3);
});

test('SubID decoration preserves Admitad route and unrelated query parameters', () => {
  const attribution = buildAffiliateAttribution(dimensions);
  const original = 'https://admitad.example/goto?ulp=%2Fproduct%3Fcolor%3Dred&erid=marker&campaign=campaign&subid3=promo&fragment=kept#anchor';
  const result = new URL(addAffiliateSubIds(original, attribution));
  assert.equal(result.pathname, '/goto');
  assert.equal(result.searchParams.get('ulp'), '/product?color=red');
  assert.equal(result.searchParams.get('erid'), 'marker');
  assert.equal(result.searchParams.get('campaign'), 'campaign');
  assert.equal(result.searchParams.get('subid3'), 'promo');
  assert.equal(result.searchParams.get('fragment'), 'kept');
  assert.equal(result.hash, '#anchor');
  assert.equal(result.searchParams.get('subid'), attribution.attributionId);
  assert.equal(result.searchParams.get('subid1'), attribution.sellerOfferId);
  assert.equal(result.searchParams.get('subid2'), 'shop_offer');
  assert.throws(() => addAffiliateSubIds('http://admitad.example/goto', attribution), /Invalid/);
  assert.throws(() => addAffiliateSubIds(original, { ...attribution, sellerOfferId: 'x'.repeat(51) }), /Invalid/);
});
