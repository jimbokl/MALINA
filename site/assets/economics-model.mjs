function number(raw, label, max, { positive = false, integer = false } = {}) {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    throw new RangeError(`${label}: укажите число${positive ? ' больше нуля' : ' от нуля'}.`);
  }
  const value = Number(String(raw).trim().replace(',', '.'));
  if (!Number.isFinite(value) || value < 0 || (positive && value === 0) || value > max || (integer && !Number.isSafeInteger(value))) {
    throw new RangeError(`${label}: укажите ${integer ? 'целое ' : ''}число ${positive ? 'больше нуля' : 'от нуля'} и не больше ${max}.`);
  }
  return value;
}

export function calculateEconomics(input) {
  const areaM2 = number(input.areaM2, 'Площадь посадки', 10000000, { positive: true });
  const capex = number(input.capex, 'Первоначальные вложения', 1000000000);
  const fixedAnnual = number(input.fixedAnnual, 'Ежегодные постоянные расходы', 1000000000);
  const harvestedKg = number(input.harvestedKg, 'Собранный урожай', 100000000);
  const lossPercent = number(input.lossPercent, 'Доля потерь', 100);
  const pricePerKg = number(input.pricePerKg, 'Цена реализации', 1000000, { positive: true });
  const variablePerKg = number(input.variablePerKg, 'Переменные расходы', 1000000);
  const years = number(input.years, 'Горизонт расчёта', 10, { positive: true, integer: true });

  const saleableKg = harvestedKg * (1 - lossPercent / 100);
  const revenue = saleableKg * pricePerKg;
  const variableAnnual = harvestedKg * variablePerKg;
  const annualCosts = fixedAnnual + variableAnnual;
  const annualCash = revenue - annualCosts;
  const contributionPerHarvestedKg = pricePerKg * (1 - lossPercent / 100) - variablePerKg;
  const breakEvenPrice = saleableKg > 0 ? annualCosts / saleableKg : null;
  const breakEvenHarvestKg = contributionPerHarvestedKg > 0
    ? (fixedAnnual + capex / years) / contributionPerHarvestedKg : null;
  const cumulative = Array.from({ length: years }, (_, index) => ({
    year: index + 1,
    cash: -capex + annualCash * (index + 1)
  }));
  const paybackYear = capex > 0 ? (cumulative.find(item => item.cash >= 0)?.year ?? null) : null;

  if (![saleableKg, revenue, variableAnnual, annualCosts, annualCash, breakEvenPrice ?? 0, breakEvenHarvestKg ?? 0, cumulative.at(-1).cash].every(Number.isFinite)) {
    throw new RangeError('Слишком большие значения для надёжного расчёта. Уменьшите масштаб сценария.');
  }
  return {
    areaM2, capex, fixedAnnual, harvestedKg, lossPercent, pricePerKg, variablePerKg, years,
    saleableKg, revenue, variableAnnual, annualCosts, annualCash,
    contributionPerHarvestedKg, breakEvenPrice, breakEvenHarvestKg,
    cumulative, paybackYear
  };
}
