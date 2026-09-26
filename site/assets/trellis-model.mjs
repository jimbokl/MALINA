function positive(value, label, limit) {
  if (value === '' || value === null || value === undefined) throw new RangeError(`${label}: укажите число больше нуля.`);
  const number = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(number) || number <= 0 || number > limit) throw new RangeError(`${label}: укажите число от 0 до ${limit}.`);
  return number;
}

export function calculateTrellis(input) {
  const length = positive(input.length, 'Длина ряда', 10000);
  const rows = positive(input.rows, 'Число рядов', 1000);
  const maxSpan = positive(input.maxSpan, 'Максимальный пролёт', 1000);
  const wireLines = positive(input.wireLines, 'Число линий проволоки', 20);
  if (!Number.isSafeInteger(rows)) throw new RangeError('Число рядов должно быть целым.');
  if (!Number.isSafeInteger(wireLines)) throw new RangeError('Число линий проволоки должно быть целым.');

  const spansPerRow = Math.max(1, Math.ceil(length / maxSpan - 1e-10));
  const endPosts = rows * 2;
  const intermediatePosts = rows * (spansPerRow - 1);
  if (endPosts + intermediatePosts > 10000000) throw new RangeError('Слишком много опор для наглядного расчёта. Разделите проект на участки.');
  const actualSpan = length / spansPerRow;
  const wireLength = length * rows * wireLines;
  return { rows, spansPerRow, endPosts, intermediatePosts, totalPosts: endPosts + intermediatePosts, wireLines, wireLength, actualSpan };
}

function priceInKopecks(value, label) {
  if (value === '' || value === null || value === undefined) throw new RangeError(`${label}: укажите цену.`);
  const raw = String(value).trim();
  const number = Number(raw.replace(',', '.'));
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(raw) || !Number.isFinite(number) || number > 1000000) {
    throw new RangeError(`${label}: укажите цену от 0 до 1 000 000 ₽ с точностью до копейки.`);
  }
  return Math.round(number * 100);
}

export function calculateTrellisCost(materials, prices) {
  const endPrice = priceInKopecks(prices.endPostPrice, 'Концевая опора');
  const intermediatePrice = priceInKopecks(prices.intermediatePostPrice, 'Промежуточная опора');
  const wirePrice = priceInKopecks(prices.wirePrice, 'Проволока');
  const endPosts = materials.endPosts * endPrice;
  const intermediatePosts = materials.intermediatePosts * intermediatePrice;
  const wire = Math.round(materials.wireLength * wirePrice);
  const total = endPosts + intermediatePosts + wire;
  if (![endPosts, intermediatePosts, wire, total].every(Number.isSafeInteger)) {
    throw new RangeError('Сумма слишком велика для точного расчёта. Разделите проект на участки.');
  }
  return { endPosts: endPosts / 100, intermediatePosts: intermediatePosts / 100, wire: wire / 100, total: total / 100 };
}
