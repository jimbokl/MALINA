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
  params.set('sort', selection.join(','));
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
    ['Где выращивать', variety.place || null],
    ['Коротко о сорте', variety.note || null]
  ];
}

export function getComparisonMeasurements(variety, traitCode) {
  if (!['yield', 'berry_weight_g'].includes(traitCode)) return [];
  const observations = traitCode === 'yield'
    ? variety?.yieldObservations || variety?.observations || (variety?.yieldObservation ? [variety.yieldObservation] : [])
    : variety?.observations || [];
  const accepted = observations.filter(item => {
    if (item?.trait_code !== traitCode ||
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

export function getComparisonYields(variety) {
  return getComparisonMeasurements(variety, 'yield');
}

export function getComparisonYield(variety) {
  return getComparisonYields(variety)[0] || null;
}

export function getComparisonLabels(includeAdmissions = false) {
  const labels = ['Культура', 'Тип плодоношения', 'Когда созревает', 'Где выращивать', 'Коротко о сорте', 'Урожайность', 'Масса ягоды'];
  return includeAdmissions ? [...labels, 'Есть ли сорт в официальном списке'] : labels;
}

const normalizePlace = value => String(value || '').trim().toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ');

const normalizeComparisonText = value => normalizePlace(value).replace(/ё/g, 'е');

export function hasComparisonDifference(values) {
  return new Set(values.map(value => normalizeComparisonText(value ?? ''))).size > 1;
}

export function searchComparisonVarieties(varieties, query) {
  const needle = normalizeComparisonText(query);
  return varieties.filter(item => [item.name, item.slug, ...(Array.isArray(item.aliases) ? item.aliases : [])]
    .some(value => normalizeComparisonText(value).includes(needle)));
}

export function comparisonPickerHref(cropKey, place, search = '', siteBase = '') {
  const input = new URLSearchParams(search);
  const params = new URLSearchParams();
  params.set('crop', cropKey === 'raspberry' ? 'raspberry' : 'strawberry');
  if (place?.region?.name_ru) params.set('region', place.region.name_ru);
  if (place?.city?.name) params.set('city', place.city.name);
  for (const key of ['setting', 'light', 'fruiting', 'harvestTiming', 'shelter', 'drainage']) {
    if (input.getAll(key).length === 1) params.set(key, input.get(key));
  }
  const cityPath = place?.city?.slug && !place.reason ? `${encodeURIComponent(place.city.slug)}/` : '';
  return `${siteBase}/podbor/${cityPath}?${params}`;
}

export function resolveComparisonPlace({ city = '', region = '', cities = [], regions = [] } = {}) {
  const cityName = String(city || '').trim();
  const regionName = String(region || '').trim();
  if (cityName) {
    const namedCities = cities.filter(item => normalizePlace(item.name) === normalizePlace(cityName));
    if (!namedCities.length) return { city: null, region: null, reason: 'unknown-city' };
    const matches = regionName
      ? namedCities.filter(item => [item.region, item.selectionRegion].some(value => value && normalizePlace(value) === normalizePlace(regionName)))
      : namedCities;
    if (!matches.length) return { city: null, region: null, reason: 'conflicting-place' };
    if (matches.length !== 1) return { city: null, region: null, reason: 'ambiguous-city' };
    const matchedCity = matches[0];
    const matchedRegion = regions.find(item => normalizePlace(item.name_ru) === normalizePlace(matchedCity.selectionRegion || matchedCity.region));
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
