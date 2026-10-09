const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// These links are part of the initial HTML and work without JavaScript.
export function cultivarEntryNavigation(item, { descriptionId = 'seo-opisanie', reviewsId = 'seo-reviews', productPath = '' } = {}) {
  const links = [
    [`#${descriptionId}`, 'Описание'], ['#seo-photo', 'Фото и источники'],
    [`#${reviewsId}`, 'Отзывы'], ['#seo-care', 'Посадка и уход']
  ];
  return `<nav class="search-entry-nav" aria-label="О сорте ${escape(item.name)}">${links.map(([href, label]) => `<a href="${escape(href)}">${label}</a>`).join('')}${productPath ? `<a class="search-entry-shop" href="${escape(productPath)}" data-cultivar-to-shop="${escape(item.slug)}" data-cta-placement="cultivar_intro">Саженцы и наличие ↗</a>` : ''}</nav>`;
}

export function articleEntryNavigation(article) {
  if (!article.entryLinks?.length) return '';
  for (const link of article.entryLinks) {
    if (!Number.isInteger(link.section) || !article.sections[link.section - 1] || !link.label) {
      throw new Error(`Invalid entry section: ${article.slug}`);
    }
  }
  return `<nav class="search-entry-nav" aria-label="Быстрые ответы">${article.entryLinks.map(link => `<a href="#section-${link.section}">${escape(link.label)}</a>`).join('')}</nav>`;
}
