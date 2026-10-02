import { resolveComparisonPlace } from './comparison-model.mjs';

export function shopNavigationContext(search, cities, regions, crop = '', base = '') {
  const params = new URLSearchParams(search);
  if (params.getAll('city').length > 1 || params.getAll('region').length > 1) return null;
  const city = params.get('city')?.trim() || '';
  const region = params.get('region')?.trim() || '';
  if (!city && !region) return null;
  const place = resolveComparisonPlace({ city, region, cities, regions });
  if (place.reason) return null;
  return {
    city: place.city?.name || '', region: place.region.name_ru,
    pickerPath: `${base}/podbor/${place.city?.slug ? `${place.city.slug}/` : ''}`,
    crop: ['raspberry', 'strawberry'].includes(crop) ? crop : ''
  };
}

export function shopContextHref(href, context, origin, base = '') {
  if (!context) return href;
  const url = new URL(href, origin);
  if (url.origin !== origin) return href;
  if (base && !url.pathname.startsWith(`${base}/`)) return href;
  const path = base ? url.pathname.slice(base.length) : url.pathname;
  if (path === '/podbor/') {
    url.pathname = context.pickerPath;
    url.searchParams.delete('city');
    if (context.city) url.searchParams.delete('region');
    else url.searchParams.set('region', context.region);
    if (context.crop) url.searchParams.set('crop', context.crop);
  } else if (/^\/(?:sorta|magazin)\/(?:[a-z0-9-]+\/)?$/.test(path)) {
    url.searchParams.set('region', context.region);
    if (context.city) url.searchParams.set('city', context.city);
    else url.searchParams.delete('city');
  } else return href;
  return `${url.pathname}${url.search}${url.hash}`;
}
