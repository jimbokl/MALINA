export function normalizePickerPlace(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е')
    .replace(/[.,\-–—]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)обл(?=\s|$)/g, '$1область')
    .replace(/(^|\s)респ(?=\s|$)/g, '$1республика')
    .replace(/(^|\s)кр(?=\s|$)/g, '$1край')
    .trim();
}

export function resolvePickerPlace(value, places) {
  const query = normalizePickerPlace(value);
  if (!query) return null;
  const place = places.find(item => normalizePickerPlace(item.name) === query);
  return place ? { region: place.region, city: place.city || '' } : null;
}
