import test from 'node:test';
import assert from 'node:assert/strict';
import { shopNavigationContext, shopContextHref } from '../assets/shop-navigation.mjs';

import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const siteSource = await readFile(new URL('../assets/site.js', import.meta.url), 'utf8');
const freshnessSource = siteSource.slice(siteSource.indexOf('function freshDeadline('), siteSource.indexOf("if (document.querySelector('[data-shop-live-price]"));

const cities = [
  { slug: 'moscow', name: 'Москва', region: 'Москва', selectionRegion: 'Московская область' },
  { slug: 'tula', name: 'Тула', region: 'Тульская область' }
];
const regions = ['Московская область', 'Тульская область'].map(name_ru => ({ name_ru }));
const origin = 'https://malinaklubnika.ru';
const redirectSource = await readFile(new URL('../assets/shop-redirect.js', import.meta.url), 'utf8');

test('прежний адрес упаковки сохраняет место, культуру и якорь при переходе в общую карточку', () => {
  for (const base of ['', '/MALINA']) {
    const link = {href: `${origin}${base}/magazin/gusar-sazhenec/`};
    let redirected;
    runInNewContext(redirectSource, {
      document: {querySelector: () => link}, URL, URLSearchParams,
      location: {origin, search: '?city=Москва&region=Московская+область&crop=raspberry&tracking=unused', hash: '#regiony', replace: url => {redirected=url;}}
    });
    const target = new URL(redirected);
    assert.equal(target.pathname, `${base}/magazin/gusar-sazhenec/`);
    assert.equal(target.searchParams.get('city'), 'Москва');
    assert.equal(target.searchParams.get('region'), 'Московская область');
    assert.equal(target.searchParams.get('crop'), 'raspberry');
    assert.equal(target.searchParams.has('tracking'), false);
    assert.equal(target.hash, '#regiony');
    assert.equal(link.href, redirected);
  }
});

test('редирект не переносит повторные параметры и не ведёт на внешний сайт', () => {
  for (const href of [`${origin}/magazin/gusar-sazhenec/`, 'https://seller.example/product']) {
    let redirected;
    runInNewContext(redirectSource, {
      document: {querySelector: () => ({href})}, URL, URLSearchParams,
      location: {origin, search:'?city=Москва&city=Тула&region=Тульская+область', hash:'', replace:url=>{redirected=url;}}
    });
    if (href.startsWith(origin)) {
      const target = new URL(redirected);
      assert.equal(target.searchParams.has('city'),false);
      assert.equal(target.searchParams.get('region'),'Тульская область');
    } else assert.equal(redirected,undefined);
  }
});

test('товар возвращает в городской подбор с культурой; прежняя московская ссылка работает', () => {
  for (const region of ['Москва', 'Московская область']) {
    const context = shopNavigationContext(new URLSearchParams({city:'Москва',region}), cities, regions, 'strawberry');
    assert.equal(shopContextHref('/podbor/', context, origin), '/podbor/moscow/?crop=strawberry');
    const variety = new URL(shopContextHref('/sorta/festivalnaya/#otzyvy',context,origin),origin);
    assert.equal(variety.searchParams.get('region'),'Московская область');
    assert.equal(variety.searchParams.get('city'),'Москва');
    assert.equal(variety.hash,'#otzyvy');
  }
});

test('область без города сохраняется в подборе, каталоге и другом товаре', () => {
  const context=shopNavigationContext('?region='+encodeURIComponent('Тульская область'),cities,regions,'raspberry');
  for(const href of ['/podbor/','/sorta/?crop=raspberry','/magazin/gusar-sazhenec/']) {
    const url=new URL(shopContextHref(href,context,origin),origin);
    assert.equal(url.searchParams.get('region'),'Тульская область');
    assert.equal(url.searchParams.has('city'),false);
    if(href.startsWith('/podbor')) assert.equal(url.searchParams.get('crop'),'raspberry');
  }
});

test('противоречивое место, повторные параметры и неизвестный город не переносятся в ссылки', () => {
  for(const search of ['?city=Москва&region=Тульская+область','?city=Москва&city=Тула','?city=Неизвестный','?region=Нет']) {
    assert.equal(shopNavigationContext(search,cities,regions,'raspberry'),null);
  }
  assert.equal(shopContextHref('/podbor/',null,origin),'/podbor/');
});

test('внешний продавец и прочие страницы не меняются; поддерживается базовый путь', () => {
  const context=shopNavigationContext('?city=Москва',cities,regions,'raspberry','/MALINA');
  assert.equal(shopContextHref('/MALINA/podbor/',context,origin,'/MALINA'),'/MALINA/podbor/moscow/?crop=raspberry');
  for(const href of ['https://seller.example/product','/about/','/podbor/'])
    assert.equal(shopContextHref(href,context,origin,'/MALINA'),href);
});

test('при истечении фида остаётся следующий шаг без цены и перехода к продавцу', () => {
  const navigation={links:['/podbor/?crop=raspberry','/sorta/?crop=raspberry']};
  const order={
    children:[{price:350},{href:'https://seller.example/product'},navigation],
    attributes:new Set(['data-shop-live-order']),classList:{add(value){this.value=value;}},
    querySelector(selector){assert.equal(selector,'[data-shop-order-navigation]');return navigation;},
    replaceChildren(...children){this.children=children;},removeAttribute(value){this.attributes.delete(value);}
  };
  const document = {
    documentElement: { dataset: { shopOffersExpires: '2020-01-01T00:00:00Z' } },
    querySelectorAll: selector => selector === '[data-shop-live-order]' ? [order] : [],
    querySelector: () => null, createElement: () => ({ textContent: '' })
  };
  runInNewContext(`${freshnessSource}\nrefreshShopFreshness();`, { document, Date });
  assert.equal(order.children[1].textContent,'Наличие уточняется');
  assert.equal(order.children[2],navigation);
  assert.equal(order.children.length,3);
  assert.equal(order.attributes.has('data-shop-live-order'),false);
  assert.equal(order.classList.value,'shop-order-empty');
});

// Run the real browser integration, not just URL helper calls.
const navigationSource = siteSource.slice(siteSource.indexOf("if (cultivarPath || /^\\/(?:sorta|magazin)"), siteSource.indexOf("window.addEventListener('error'"))
  .replace(/\bimport\s*\(/g, '__import(');

test('страница товара передаёт культуру и область во все следующие шаги', async () => {
  for (const search of ['?city=Москва&region=Москва', '?region=Тульская+область']) {
    const links = ['/podbor/?crop=strawberry', '/sorta/?crop=strawberry', '/magazin/other/', '/sorta/festivalnaya/#otzyvy', 'https://seller.example/product']
      .map(href => ({ href: new URL(href, origin).href }));
    const document = {
      querySelector: selector => selector === '.shop-product' ? { dataset: { crop: 'strawberry' } } : null,
      querySelectorAll: () => links
    };
    runInNewContext(navigationSource, {
      document, cultivarPath: null, routePath: '/magazin/aziya-sazhenec/', siteBase: '',
      location: new URL('/magazin/aziya-sazhenec/' + search, origin), URLSearchParams,
      fetch: async path => ({ ok: true, json: async () => path.endsWith('cities.json') ? cities : {regions} }),
      __import: async () => ({shopNavigationContext, shopContextHref})
    });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(new URL(links[0].href, origin).searchParams.get('crop'), 'strawberry');
    const region = search.includes('city=') ? 'Московская область' : 'Тульская область';
    assert.equal(new URL(links[1].href, origin).searchParams.get('region'), region);
    assert.equal(new URL(links[2].href, origin).searchParams.get('region'), region);
    assert.equal(new URL(links[3].href, origin).hash, '#otzyvy');
    assert.equal(links[4].href, 'https://seller.example/product');
    if (search.includes('city=')) assert.equal(new URL(links[0].href, origin).pathname, '/podbor/moscow/');
    else assert.equal(new URL(links[0].href, origin).searchParams.get('region'), region);
  }
});
