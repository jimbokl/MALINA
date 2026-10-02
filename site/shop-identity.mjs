export function normalizedShopName(value) {
  return typeof value === 'string'
    ? value.normalize('NFKC').toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').replace(/\s+/g, ' ').trim()
    : '';
}

export function matchesExpectedName(name, expectedName) {
  const actual = normalizedShopName(name);
  const expected = normalizedShopName(expectedName);
  if (!actual || !expected) return false;
  const position = actual.indexOf(expected);
  if (position < 0) return false;
  const before = position > 0 ? actual[position - 1] : '';
  const after = actual[position + expected.length] || '';
  return !/[\p{L}\p{N}]/u.test(before) && !/[\p{L}\p{N}]/u.test(after);
}
