function positive(raw, label, max) {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    throw new RangeError(`${label}: укажите число больше нуля.`);
  }
  const value = Number(String(raw).replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0 || value > max) {
    throw new RangeError(`${label}: укажите число больше нуля и не больше ${max}.`);
  }
  return value;
}

export function calculateDrip(input) {
  const length = positive(input.length, 'Общая длина ленты', 100000);
  const spacing = positive(input.spacing, 'Шаг капельниц', 1000);
  const flow = positive(input.flow, 'Расход одной капельницы', 100);
  const measuredCount = input.emitterCount === undefined || input.emitterCount === null || String(input.emitterCount).trim() === ''
    ? null : positive(input.emitterCount, 'Число капельниц', 1000000);
  if (measuredCount !== null && !Number.isSafeInteger(measuredCount)) {
    throw new RangeError('Число капельниц должно быть целым.');
  }
  const emitterCount = measuredCount ?? Math.round(length * 100 / spacing);
  if (!Number.isSafeInteger(emitterCount) || emitterCount < 1 || emitterCount > 1000000) {
    throw new RangeError('Невозможно оценить число капельниц. Проверьте длину и шаг или укажите фактическое число.');
  }
  const hourlyLiters = emitterCount * flow;
  if (!Number.isFinite(hourlyLiters) || hourlyLiters > 100000000) {
    throw new RangeError('Расход слишком велик для этого калькулятора. Разделите систему на участки.');
  }
  if (input.mode === 'duration') {
    const minutes = positive(input.minutes, 'Время работы', 10080);
    return { emitterCount, estimated: measuredCount === null, hourlyLiters, minutes, volumeLiters: hourlyLiters * minutes / 60 };
  }
  if (input.mode === 'volume') {
    const volumeLiters = positive(input.volumeLiters, 'Нужный объём', 10000000);
    const minutes = volumeLiters / hourlyLiters * 60;
    if (minutes > 10080) throw new RangeError('Расчётное время больше недели. Проверьте исходные данные или разделите систему на участки.');
    return { emitterCount, estimated: measuredCount === null, hourlyLiters, minutes, volumeLiters };
  }
  throw new RangeError('Выберите режим расчёта.');
}
