import { calculateEconomics } from './economics-model.mjs';

const form = document.querySelector('#economics-form');
if (form) {
  const output = document.querySelector('#economics-result');
  const format = (value, digits = 0) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(value);
  const money = value => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value);
  const ceilTo = (value, step) => Math.ceil((value - 1e-10) / step) * step;
  const yearsLabel = years => `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;

  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const result = calculateEconomics(Object.fromEntries(new FormData(form)));
      const netLabel = result.annualCash < 0 ? 'Минус за год при этих вводных' : 'Денежный результат за год';
      const payback = result.capex === 0
        ? 'Первоначальные вложения указаны как ноль.'
        : result.paybackYear === null
          ? 'За выбранный горизонт первоначальные вложения в этом сценарии не возвращаются.'
          : `При неизменных исходных цифрах вложения возвращаются к концу ${result.paybackYear}-го года.`;
      const breakEven = result.breakEvenHarvestKg === null
        ? 'При заданной цене после потерь каждый дополнительный килограмм не покрывает переменные расходы; точки безубыточности по объёму нет.'
        : `Для покрытия ежегодных расходов и первоначальных вложений за ${yearsLabel(result.years)} нужно собрать не менее ${format(ceilTo(result.breakEvenHarvestKg, 0.1), 1)} кг за год при тех же потерях и цене.`;
      output.className = 'planting-result economics-result';
      output.innerHTML = `<span class="eyebrow">СЦЕНАРИЙ ПО ВАШИМ ЦИФРАМ</span><strong>${money(result.annualCash)}</strong><p>${netLabel}. ${payback}</p><dl><div><dt>Масштаб посадки</dt><dd>${format(result.areaM2, 1)} м²</dd></div><div><dt>Собрано / продано</dt><dd>${format(result.harvestedKg, 1)} / ${format(result.saleableKg, 1)} кг</dd></div><div><dt>Выручка за год</dt><dd>${money(result.revenue)}</dd></div><div><dt>Постоянные + переменные расходы за год</dt><dd>${money(result.annualCosts)}</dd></div><div><dt>Накопленный результат за ${yearsLabel(result.years)} с учётом первоначальных вложений</dt><dd>${money(result.cumulative.at(-1).cash)}</dd></div><div><dt>Минимальная цена для покрытия ежегодных расходов</dt><dd>${result.breakEvenPrice === null ? 'Нельзя рассчитать без товарного урожая' : `${money(ceilTo(result.breakEvenPrice, 0.01))} / кг`}</dd></div></dl><h3>Проверка порога</h3><p>${breakEven}</p><div class="economics-years" aria-label="Накопленный результат по годам">${result.cumulative.map(item => `<div><span>Год ${item.year}</span><strong>${money(item.cash)}</strong></div>`).join('')}</div><p>Для каждого года использованы заданные вами сбор, потери, цена и расходы.</p>`;
    } catch (error) {
      output.className = 'planting-result planting-error';
      output.textContent = error.message;
    }
    output.hidden = false;
    output.focus();
  });
}
