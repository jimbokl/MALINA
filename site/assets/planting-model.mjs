function positive(value, label) {
  const number = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(number) || number <= 0) throw new RangeError(`${label}: укажите число больше нуля.`);
  return number;
}

export function calculatePlanting(input) {
  const length = positive(input.length, 'Длина грядки');
  const width = positive(input.width, 'Ширина грядки');
  const beds = positive(input.beds, 'Число грядок');
  const rowSpacing = positive(input.rowSpacing, 'Расстояние между рядами');
  const plantSpacing = positive(input.plantSpacing, 'Расстояние между растениями');
  if (!Number.isSafeInteger(beds)) throw new RangeError('Число грядок должно быть целым.');
  if (length > 10000 || width > 1000 || beds > 10000 || rowSpacing > 100000 || plantSpacing > 100000) {
    throw new RangeError('Проверьте размеры: значение вне диапазона калькулятора.');
  }
  // A plant is placed at the centre of each full spacing interval, leaving half an interval at each edge.
  const rows = Math.floor(width * 100 / rowSpacing + 1e-9);
  const plantsPerRow = Math.floor(length * 100 / plantSpacing + 1e-9);
  const total = rows * plantsPerRow * beds;
  if (!Number.isSafeInteger(total) || total > 10000000) throw new RangeError('Слишком много растений для наглядного расчёта. Уменьшите число грядок или разделите участок на части.');
  return { rows, plantsPerRow, beds, total, area: length * width * beds, rowLength: length * rows * beds };
}
