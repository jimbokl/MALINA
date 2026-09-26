import { comparisonHref, MAX_COMPARISON } from './comparison-model.mjs';

const output = document.querySelector('#picker-output');
const form = document.querySelector('#picker-form');

if (output && form) {
  const bar = output.querySelector('#picker-compare-bar');
  const status = output.querySelector('#picker-compare-status');
  const link = output.querySelector('#picker-compare-link');
  const choices = [...output.querySelectorAll('.picker-compare-checkbox')];
  const cityContext = form.querySelector('#picker-city-context');
  const siteBase = document.documentElement.dataset.siteBase || '';
  let notice = '';

  bar.hidden = false;
  choices.forEach(input => { input.closest('.picker-compare-option').hidden = false; });

  function update() {
    const selected = choices.filter(input => input.checked && !input.closest('.variety-card').hidden);
    const crop = selected[0]?.closest('.variety-card').dataset.crop;
    const count = selected.length;
    for (const input of choices) {
      const card = input.closest('.variety-card');
      input.disabled = !input.checked && (card.hidden || (crop && card.dataset.crop !== crop) || count >= MAX_COMPARISON);
    }
    status.textContent = notice || (count === 0
      ? 'Отметьте от двух до четырёх сортов одной культуры, чтобы сравнить их по источникам.'
      : count === 1
        ? 'Выбран один сорт. Добавьте ещё один той же культуры.'
        : `Выбрано ${count} ${count < 5 ? 'сорта' : 'сортов'}. Сравнение сохранит выбранные сорта.`);
    link.hidden = count < 2;
    if (count >= 2) {
      const params = new URLSearchParams();
      const region = form.elements.region.value.trim();
      if (region) params.set('region', region);
      if (cityContext && !cityContext.hidden && form.dataset.city) params.set('city', form.dataset.city);
      const slugs = selected.map(input => input.value);
      link.href = comparisonHref(crop, slugs, params.toString(), siteBase);
      link.textContent = `Сравнить ${count} сорта ↗`;
    }
  }

  output.addEventListener('change', event => {
    if (!event.target.matches('.picker-compare-checkbox')) return;
    notice = '';
    update();
  });

  output.addEventListener('picker:results', () => {
    for (const input of choices) {
      if (input.closest('.variety-card').hidden) input.checked = false;
    }
    notice = '';
    update();
  });

  update();
}
