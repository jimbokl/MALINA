import test from 'node:test';
import assert from 'node:assert/strict';
import { currentShopOffers, shopSnapshotIsCurrent, shopStockState } from '../shop-model.mjs';

const now = new Date('2026-09-28T12:00:00Z');
const merchantUrl = 'https://agrosemfond.ru/catalog/gusar/';
const affiliateUrl = `https://rzekl.com/g/abc/?ulp=${encodeURIComponent(merchantUrl)}`;
const product = { id: '67762', name: 'Малина Гусар', availability: 'in_stock', priceMinor: 39900, currency: 'RUB', merchantUrl, affiliateUrl, imagePath: '/assets/shop/67762.jpg' };
const snapshot = { checkedAt: '2026-09-28T11:00:00Z', expiresAt: '2026-09-29T11:00:00Z', products: [product] };

test('актуальный проверенный товар доступен для страницы и заказа', () => {
  const offers = currentShopOffers(snapshot, [{ id: '67762' }], now);
  assert.equal(offers.get('67762')?.priceMinor, 39900);
  assert.equal(offers.get('67762')?.imagePath, '/assets/shop/67762.jpg');
});

test('устаревший снимок и отсутствующий товар не создают кнопку заказа', () => {
  assert.equal(currentShopOffers({ ...snapshot, expiresAt: '2026-09-28T11:59:59Z' }, [{ id: '67762' }], now).size, 0);
  assert.equal(currentShopOffers(snapshot, [{ id: 'other' }], now).size, 0);
  assert.equal(currentShopOffers({ ...snapshot, products: [{ ...product, availability: 'out_of_stock' }] }, [{ id: '67762' }], now).size, 0);
});

test('нет в наличии только при свежем явном статусе каждого артикула', () => {
  const second = { id: 'other' };
  const variants = [{ id: product.id }, second];
  const unavailable = { ...snapshot, products: [
    { id: product.id, availability: 'out_of_stock' },
    { id: second.id, availability: 'out_of_stock' }
  ] };
  assert.equal(shopSnapshotIsCurrent(snapshot, now), true);
  assert.equal(shopStockState(unavailable, variants, new Map(), now), 'out_of_stock');
  assert.equal(shopStockState({ ...unavailable, products: unavailable.products.slice(0, 1) }, variants, new Map(), now), 'unknown');
  assert.equal(shopStockState({ ...unavailable, expiresAt: '2026-09-28T11:59:59Z' }, variants, new Map(), now), 'unknown');
  assert.equal(shopStockState(null, variants, new Map(), now), 'unknown');
  assert.equal(shopStockState(unavailable, variants, new Map([[second.id, product]]), now), 'in_stock');
});

test('подменённая ссылка продавца и трекера отклоняется', () => {
  for (const changed of [
    { merchantUrl: 'https://evil.example/item' },
    { affiliateUrl: 'https://evil.example/redirect' },
    { affiliateUrl: `https://rzekl.com/g/abc/?ulp=${encodeURIComponent('https://agrosemfond.ru/other/')}` }
  ]) {
    assert.equal(currentShopOffers({ ...snapshot, products: [{ ...product, ...changed }] }, [{ id: '67762' }], now).size, 0);
  }
});
