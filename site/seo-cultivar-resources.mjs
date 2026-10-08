import { externalVarietyPhotoReferences } from './variety-photo-references.mjs';
import { seoPhotoSupplement } from './seo-photo-supplement-2026-10-08.mjs';
import { growerRaspberrySources } from './seo-grower-raspberry-2026-10-08.mjs';
import { growerStrawberrySources } from './seo-grower-strawberry-2026-10-08.mjs';
import { externalReaderSources } from './seo-reader-sources-2026-10-08.mjs';
import { varietyMedia, varietyPhotoSources, varietySupplementalPhotoSources } from './variety-media.mjs';

const asiaDiary = {
  cultivarSlug: 'aziya', name: 'Азия', cropKey: 'strawberry',
  url: 'https://7dach.ru/Roselin/klubnika-aziya-moi-vpechatleniya-pervyy-opyt-302706.html',
  title: 'Клубника «Азия». Мои впечатления, первый опыт',
  author: 'Ирина Топчий (Roselin)', publishedIso: '2023-06-11', place: 'Майкоп, Адыгея',
  summary: 'Ирина описывает первый сбор после осенней посадки: ягоды были плотными, сладкими при полном созревании, со слабым ароматом. Она также отмечает повреждение цветов долгоносиком. В дневнике показаны ягоды, кусты и усы с подписями сорта Азия.',
  kind: 'grower_diary', hasNamedPhotos: true, checkedIso: '2026-10-08'
};

export const growerSources = [...growerRaspberrySources, ...growerStrawberrySources, asiaDiary];
const belongsTo = (source, item) => (source.cultivarSlug || source.slug) === item.slug && source.cropKey === item.cropKey;
export const cultivarGrowerSources = item => growerSources.filter(source => belongsTo(source, item));
export const cultivarReaderSources = item => externalReaderSources.filter(source => belongsTo(source, item));
export const cultivarReviewSources = item => [
  ...cultivarGrowerSources(item).filter(source => source.kind !== 'named_photo_only'),
  ...cultivarReaderSources(item)
];

export function cultivarPhotoReference(item, extra) {
  const media = varietyMedia[item.slug];
  const local = media?.crop === item.cropKey
    ? (media.kind === 'photo' ? varietyPhotoSources[item.slug] : varietySupplementalPhotoSources[item.slug])
    : null;
  if (local?.identityEvidence) return { url: local.sourcePage, publisher: local.author, kind: 'licensed_local_cultivar_photo', file: local.file, scope: local.identityEvidence };
  const existing = externalVarietyPhotoReferences[item.slug];
  if (existing) return existing;
  const url = extra?.photoUrl || item.photoUrl;
  if (url) return { url, publisher: extra?.photoLabel || item.photoLabel || 'автор исходного материала' };
  if (seoPhotoSupplement[item.slug]) return seoPhotoSupplement[item.slug];
  const diary = cultivarGrowerSources(item).find(source => source.hasNamedPhotos);
  if (diary) return { url: diary.url, publisher: diary.author, checkedIso: diary.checkedIso, title: diary.title, kind: 'grower_labelled_photo' };
  const readerPage = cultivarReaderSources(item).find(source => source.hasNamedPhotos && source.photoCaption);
  return readerPage ? { url: readerPage.url, publisher: readerPage.publisher || 'ДачаОтзыв', checkedIso: readerPage.checkedIso, title: readerPage.title, kind: 'publisher_labelled_photo', scope: readerPage.photoScope } : null;
}

const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const link = (url, label) => `<a href="${e(url)}">${e(label)}</a>`;
const date = iso => iso ? iso.split('-').reverse().join('.') : '';

export function externalReviewsHtml(item) {
  const diaries = cultivarGrowerSources(item).filter(source => source.kind !== 'named_photo_only');
  const readers = cultivarReaderSources(item);
  if (!diaries.length && !readers.length) return '';
  return `<div class="external-grower-sources"><h3>Дневники и внешние отзывы</h3><p>Личный опыт садоводов на других сайтах. Условия и впечатления относятся к участкам авторов.</p><ul>${diaries.map(source => `<li>${link(source.url, source.title)} — ${e(source.author)}${source.place ? `, ${e(source.place)}` : ''}, ${date(source.publishedIso)}.<p>${e(source.summary)}</p></li>`).join('')}${readers.map(source => `<li>${link(source.url, `Отзывы о ${item.name} на «${source.publisher || 'ДачаОтзыв'}»`)}: ${source.authors.map(author => `${e(author.author)} (${author.date ? date(author.date) : 'дата публикации не указана'})`).join('; ')}.</li>`).join('')}</ul></div>`;
}

export function cultivarPhotoHtml(item, extra) {
  const photo = cultivarPhotoReference(item, extra);
  if (!photo) return `<p>Проверенной фотографии ${e(item.name)} пока нет.</p>`;
  const compare = ['cabrillo', 'san-andreas'].includes(item.slug) && photo.publisher.includes('Canadian');
  return `<p>${photo.kind === 'licensed_local_cultivar_photo' ? 'Сортовая фотография показана на этой странице с подписью и указанием источника.' : compare ? 'В первоисточнике сорт подписан на сравнительной фотографии вместе с другими сортами.' : 'Фотографию с названием сорта можно посмотреть в исходном материале.'}</p>${link(photo.url, `Фото ${item.name}: ${photo.publisher}`)}${photo.kind === 'publisher_labelled_photo' ? `<p>${e(photo.scope)}</p>` : ''}`;
}
