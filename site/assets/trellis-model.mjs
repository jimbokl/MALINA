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
