export const MAX_COMPARISON = 4;

export function parseSelection(value, varieties, cropKey) {
  const known = new Map(varieties.filter(item => item.cropKey === cropKey).map(item => [item.slug, item]));
  const seen = new Set();
  return String(value || '').split(',').map(slug => slug.trim()).filter(slug => {
    if (!known.has(slug) || seen.has(slug) || seen.size >= MAX_COMPARISON) return false;
    seen.add(slug);
    return true;
  });
}

export function toggleSelection(selection, slug, varieties, cropKey) {
  const item = varieties.find(value => value.slug === slug);
  if (!item || item.cropKey !== cropKey) return { selection: [...selection], reason: 'wrong-crop' };
  if (selection.includes(slug)) return { selection: selection.filter(value => value !== slug), reason: null };
  if (selection.length >= MAX_COMPARISON) return { selection: [...selection], reason: 'limit' };
  return { selection: [...selection, slug], reason: null };
}

export function comparisonHref(cropKey, selection, search = '', siteBase = '') {
  const params = new URLSearchParams(search);
  if (selection.length) params.set('sort', selection.join(','));
  else params.delete('sort');
  const query = params.toString();
  return `${siteBase}/sravnenie/${cropKey === 'raspberry' ? 'malina' : 'klubnika'}/${query ? `?${query}` : ''}`;
}

export function getComparisonFacts(variety) {
  return [
    ['Культура', variety.crop],
    ['Тип плодоношения', variety.fruitingLabel || null],
    ['Период по источнику', variety.period || null],
    ['Указанное место выращивания', variety.place || null],
    ['Что сообщает источник', variety.note || null]
  ];
}
