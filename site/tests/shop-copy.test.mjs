import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShopArticle, buildShopLead } from '../shop-copy.mjs';

test('feed copy uses only offer identity and commercial notation, not unreviewed cultivar claims', () => {
  const product = {
    id: '123',
    crop: 'raspberry',
    name: 'Малина Гусар, контейнер P9, 2 шт.',
    categoryId: 'Плодовые/Малина/Обыкновенная',
    description: 'Урожай 20 кг с куста, подходит для любого региона.'
  };
  const article = buildShopArticle(product);
  const text = [article.title, ...article.paragraphs, buildShopLead(product)].join(' ');
  assert.match(text, /Малина Гусар/);
  assert.match(text, /контейнер/);
  assert.match(text, /P9/);
  assert.match(text, /2 шт/);
  assert.doesNotMatch(text, /20 кг|любого региона/);
  assert.equal(article.paragraphs.length, 3);
});

test('copy handles strawberry and a plain category without inventing details', () => {
  const article = buildShopArticle({ crop: 'strawberry', name: 'Клубника Азия', category: 'Саженцы земляники/Рассада' });
  assert.match(article.title, /Клубника Азия/);
  assert.match(article.paragraphs.join(' '), /рассады клубники/);
  assert.doesNotMatch(article.paragraphs.join(' '), /ранн|крупноплодн|урожай/iu);
});

test('unknown crop or missing name cannot silently become product copy', () => {
  assert.throws(() => buildShopArticle({ crop: 'other', name: 'Название' }));
  assert.throws(() => buildShopLead({ crop: 'raspberry' }));
});

test('seller age is attributed and a duplicate offer gets a distinct title', () => {
  const article = buildShopArticle({
    id: '123456', duplicateName: true, crop: 'raspberry', name: 'Малина Атлант',
    categoryId: 'Плодовые/Малина/Ремонтантная',
    description: 'ПрименениеУрожайность 10 кг. Возраст саженца1 годУсловия выращиванияСолнце.'
  });
  assert.equal(article.title, 'Малина Атлант — товар № 123456');
  assert.match(article.paragraphs.join(' '), /В описании продавца указан возраст саженца — 1 год/);
  assert.match(article.paragraphs.join(' '), /схему ухода и обрезки/);
  assert.doesNotMatch(article.paragraphs.join(' '), /10 кг|Урожайность/);
});

test('bundle composition is taken from labeled seller lines', () => {
  const article = buildShopArticle({
    id: '789', crop: 'strawberry', name: 'Набор «Ягодный экспресс» 3 саженца',
    categoryId: 'Саженцы земляники/Наборы земляники',
    description: 'Состав набора:\nЗемляника садовая Априка 1 шт.горшок 0,5 л.\nЗемляника садовая Арианна 1 шт.горшок 0,5 л.\nЗемляника садовая Альба 1 шт.горшок 0,5 л.'
  });
  assert.match(article.paragraphs.join(' '), /Априка.*Арианна.*Альба/);
  assert.match(article.paragraphs.join(' '), /В описании продавца перечислены/);
  assert.doesNotMatch(article.paragraphs.join(' '), /шт\.горшок/);
});
