import { resolveComparisonPlace } from './comparison-model.mjs';

export function resolveAdmissionSelection(search, places, admissionNumbers) {
  const params = new URLSearchParams(search);
  if (!params.has('city') && !params.has('region')) return { kind: 'none' };
  if (params.getAll('city').length > 1 || params.getAll('region').length > 1) return { kind: 'unknown' };
  const place = resolveComparisonPlace({
    city: params.get('city') || '', region: params.get('region') || '',
    cities: places.cities, regions: places.regions
  });
  if (!place.region) return place.reason === 'unmapped-region' && place.city
    ? { kind: 'unmapped', place }
    : { kind: 'unknown' };
  const number = place.region.admission_region_number;
  if (!Number.isInteger(number)) return { kind: 'unmapped', place };
  return { kind: admissionNumbers.includes(number) ? 'admitted' : 'not-admitted', place, number };
}
