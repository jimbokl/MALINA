import { raspberryFacets, raspberryFacetVarieties } from './catalog-facets.mjs';

const context = 'https://schema.org';

const absolute = (siteUrl, path) => `${siteUrl}${path}`;

const breadcrumbs = (siteUrl, entries) => ({
  '@type': 'BreadcrumbList',
  itemListElement: entries.map(([name, path], index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name,
    item: absolute(siteUrl, path)
  }))
});

const listedPages = (siteUrl, items, pathFor) => ({
  '@type': 'ItemList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name ?? item.title,
    url: absolute(siteUrl, pathFor(item))
  }))
});

export function pageStructuredData({ siteUrl, path, title, description, varieties, articles }) {
  if (!siteUrl) return '';

  const home = ['Главная', '/'];
  const catalog = ['Каталог сортов', '/sorta/'];
  const journal = ['Журнал', '/zhurnal/'];
  let page;
  let trail;

  if (path === '/sorta/') {
    trail = [home, catalog];
    page = {
      '@type': 'CollectionPage',
      name: title,
      description,
      url: absolute(siteUrl, path),
      mainEntity: listedPages(siteUrl, varieties, variety => `/sorta/${variety.slug}/`)
    };
  } else if (raspberryFacets.some(facet => facet.path === path)) {
    const facet = raspberryFacets.find(item => item.path === path);
    trail = [home, catalog, [facet.label, path]];
    page = {
      '@type': 'CollectionPage',
      name: title,
      description,
      url: absolute(siteUrl, path),
      mainEntity: listedPages(siteUrl, raspberryFacetVarieties(varieties, facet), variety => `/sorta/${variety.slug}/`)
    };
  } else if (path.startsWith('/sorta/')) {
    const variety = varieties.find(item => path === `/sorta/${item.slug}/`);
    if (!variety) return '';
    trail = [home, catalog, [variety.name, path]];
    page = {
      '@type': 'WebPage',
      name: title,
      description,
      url: absolute(siteUrl, path),
      about: { '@type': 'Thing', name: `${variety.crop}: ${variety.name}` }
    };
  } else if (path === '/zhurnal/' || path === '/zhurnal/malina/' || path === '/zhurnal/klubnika/') {
    const crop = path === '/zhurnal/malina/' ? 'raspberry' : path === '/zhurnal/klubnika/' ? 'strawberry' : '';
    const selected = crop ? articles.filter(article => article.crop === crop || article.crop === 'both') : articles;
    trail = crop ? [home, journal, [crop === 'raspberry' ? 'Малина' : 'Клубника', path]] : [home, journal];
    page = {
      '@type': 'CollectionPage',
      name: title,
      description,
      url: absolute(siteUrl, path),
      mainEntity: listedPages(siteUrl, selected, article => `/zhurnal/${article.slug}/`)
    };
  } else if (path === '/otzyvy/') {
    trail = [home, ['Отзывы', path]];
    page = { '@type': 'WebPage', name: title, description, url: absolute(siteUrl, path) };
  } else {
    return '';
  }

  return JSON.stringify({ '@context': context, '@graph': [page, breadcrumbs(siteUrl, trail)] }).replaceAll('<', '\\u003c');
}
