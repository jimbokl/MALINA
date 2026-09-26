import { calculateDrip } from './drip-model.mjs';

const form = document.querySelector('#drip-form');
if (form) {
  const output = document.querySelector('#drip-result');
  const durationFields = document.querySelector('#drip-duration-fields');
  const volumeFields = document.querySelector('#drip-volume-fields');
  const format = (value, digits = 1) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: digits }).format(value);

  function setMode() {
    const duration = form.elements.mode.value === 'duration';
    durationFields.hidden = !duration;
    durationFields.disabled = !duration;
    volumeFields.hidden = duration;
    volumeFields.disabled = duration;
    output.hidden = true;
  }
  form.addEventListener('change', event => {
    if (event.target.name === 'mode') setMode();
  });
  setMode();

  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const result = calculateDrip(Object.fromEntries(new FormData(form)));
      output.className = 'planting-result';
      output.innerHTML = `<span class="eyebrow">РАСЧЁТ ПО ВАШЕЙ ЛЕНТЕ</span><strong>${form.elements.mode.value === 'duration' ? `${format(result.volumeLiters)} л` : `${format(result.minutes)} мин`}</strong><dl><div><dt>Капельницы в работающей зоне</dt><dd>${result.estimated ? '≈ ' : ''}${format(result.emitterCount, 0)} шт.</dd></div><div><dt>Общий расход</dt><dd>${format(result.hourlyLiters)} л/ч</dd></div><div><dt>Время работы</dt><dd>${format(result.minutes)} мин</dd></div><div><dt>Объём воды</dt><dd>${format(result.volumeLiters)} л</dd></div></dl><p>${result.estimated ? 'Число капельниц оценено по длине и шагу. Для точного расчёта пересчитайте их и укажите фактическое число.' : 'Число капельниц указано вами.'} Проверьте поток мерной ёмкостью и состояние почвы у корней.</p>`;
    } catch (error) {
      output.className = 'planting-result planting-error';
      output.textContent = error.message;
    }
    output.hidden = false;
    output.focus();
  });
}
