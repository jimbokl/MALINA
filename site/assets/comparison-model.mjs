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

export function cultivarHref(slug, { city = '', region = '', siteBase = '' } = {}) {
  const params = new URLSearchParams();
  if (city.trim()) params.set('city', city.trim());
  if (region.trim()) params.set('region', region.trim());
  const query = params.toString();
  return `${siteBase}/sorta/${encodeURIComponent(slug)}/${query ? `?${query}` : ''}`;
}

export function getComparisonFacts(variety) {
  return [
    ['Культура', variety.crop],
    ['Тип плодоношения', variety.fruitingLabel || null],
    ['Когда созревает', variety.period || null],
    ['Где изучали сорт', variety.place || null],
    ['Коротко о сорте', variety.note || null]
  ];
}

export function getComparisonYields(variety) {
  const observations = variety?.yieldObservations || variety?.observations || (variety?.yieldObservation ? [variety.yieldObservation] : []);
  const accepted = observations.filter(item => {
    if (item?.trait_code !== 'yield' ||
      !((Number.isFinite(item.value_number) && String(item.unit || '').trim()) || String(item.value_text || '').trim())) return false;
    const evidence = item.evidence;
    if (!evidence || !String(evidence.place_text || '').trim() ||
      !(String(evidence.period_from || '').trim() || String(evidence.period_to || '').trim()) || !String(evidence.setting_text || '').trim() ||
      !String(item.source_title || '').trim() || !String(evidence.source_locator || '').trim()) return false;
    try { return new URL(item.source_url).protocol === 'https:'; } catch { return false; }
  });

  const number = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
  return accepted.map(observation => {
    const amount = Number.isFinite(observation.value_number)
      ? `${number(observation.value_number)}${Number.isFinite(observation.value_max) ? `–${number(observation.value_max)}` : ''} ${observation.unit}`
      : String(observation.value_text).trim();
    const evidence = observation.evidence;
    const period = evidence.period_from && evidence.period_to
      ? `${evidence.period_from}–${evidence.period_to}`
      : evidence.period_from || evidence.period_to || '';
    const context = [evidence.place_text, period, evidence.setting_text].filter(Boolean).join(' · ');
    return {
      value: amount,
      context,
      sourceUrl: new URL(observation.source_url).href,
      sourceTitle: observation.source_title || '',
      sourceLocator: evidence.source_locator || ''
    };
  });
}

export function getComparisonYield(variety) {
  return getComparisonYields(variety)[0] || null;
}

export function getComparisonLabels(includeAdmissions = false) {
  const labels = ['Культура', 'Тип плодоношения', 'Когда созревает', 'Где изучали сорт', 'Коротко о сорте', 'Урожайность'];
  return includeAdmissions ? [...labels, 'Есть ли сорт в официальном списке'] : labels;
}

const normalizePlace = value => String(value || '').trim().toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ');

export function resolveComparisonPlace({ city = '', region = '', cities = [], regions = [] } = {}) {
  const cityName = String(city || '').trim();
  const regionName = String(region || '').trim();
  if (cityName) {
    const namedCities = cities.filter(item => normalizePlace(item.name) === normalizePlace(cityName));
    if (!namedCities.length) return { city: null, region: null, reason: 'unknown-city' };
    const matches = regionName
      ? namedCities.filter(item => normalizePlace(item.region) === normalizePlace(regionName))
      : namedCities;
    if (!matches.length) return { city: null, region: null, reason: 'conflicting-place' };
    if (matches.length !== 1) return { city: null, region: null, reason: 'ambiguous-city' };
    const matchedCity = matches[0];
    const matchedRegion = regions.find(item => normalizePlace(item.name_ru) === normalizePlace(matchedCity.region));
    return matchedRegion
      ? { city: matchedCity, region: matchedRegion, reason: null }
      : { city: matchedCity, region: null, reason: 'unmapped-region' };
  }
  if (!regionName) return { city: null, region: null, reason: null };
  const matches = regions.filter(item => normalizePlace(item.name_ru) === normalizePlace(regionName));
  return matches.length === 1
    ? { city: null, region: matches[0], reason: null }
    : { city: null, region: null, reason: 'unknown-region' };
}

export function admissionForPlace(variety, place) {
  const number = place?.region?.admission_region_number;
  if (!Number.isInteger(number)) return null;
  return (variety.admissions || []).find(item => item.admission_region_number === number) || null;
}
