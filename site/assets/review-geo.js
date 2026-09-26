// Match the place an author supplied, without inferring climate or nearby towns.
export function normalizeReviewPlace(value) {
  if (typeof value !== 'string') return '';
  return value.normalize('NFKC').toLocaleLowerCase('ru-RU').trim()
    .replace(/ё/g, 'е')
    .replace(/^(?:г\.\s*|г\s+|город\s+)/, '')
    .replace(/(^|\s)обл\.?(?=\s|$)/g, '$1область')
    .replace(/(^|\s)респ\.?(?=\s|$)/g, '$1республика')
    .replace(/[‐‑–—−]/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.]+$/, '');
}

export function matchesReviewPlace(place, { city = '', region = '' } = {}) {
  const terms = [city, region].map(normalizeReviewPlace).filter(Boolean);
  if (!terms.length) return false;
  const parts = typeof place === 'string' ? [place, ...place.split(/[,;/|]/)].map(normalizeReviewPlace).filter(Boolean) : [];
  return parts.some(part => terms.includes(part));
}

export function describeReviewPlace({ city = '', region = '' } = {}) {
  if (city && region && normalizeReviewPlace(city) !== normalizeReviewPlace(region)) {
    return `Город: ${city} или регион: ${region} (целиком)`;
  }
  return city ? `Место: ${city}` : region ? `Регион: ${region}` : '';
}

// Geography belongs to the root experience. Replies retain their original place
// and stay in the discussion, including answers from another city or country.
export function filterReviewThreads(reviews, { city = '', region = '', cultivar = '' } = {}) {
  const byId = new Map(reviews.map(review => [review.id, review]));
  const geoActive = [city, region].some(value => normalizeReviewPlace(value));
  const wantedCultivar = cultivar.trim().toLocaleLowerCase('ru-RU');
  const acceptedRoots = new Set(reviews.filter(review => review.parent_id == null
    && (!wantedCultivar || String(review.cultivar_name || '').trim().toLocaleLowerCase('ru-RU') === wantedCultivar)
    && (!geoActive || matchesReviewPlace(review.region, { city, region })))
    .map(review => review.id));
  const rootIds = new Map();
  function rootId(review) {
    const path = [];
    const seen = new Set();
    let current = review;
    let id = null;
    while (current && !seen.has(current.id)) {
      if (rootIds.has(current.id)) { id = rootIds.get(current.id); break; }
      path.push(current.id);
      seen.add(current.id);
      if (current.parent_id == null) { id = current.id; break; }
      current = byId.get(current.parent_id);
    }
    for (const item of path) rootIds.set(item, id);
    return id;
  }
  return reviews.filter(review => acceptedRoots.has(rootId(review)));
}
