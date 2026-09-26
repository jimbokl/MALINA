import { calculatePlanting } from './planting-model.mjs';

const form = document.querySelector('#planting-form');
if (form) {
  const output = document.querySelector('#planting-result');
  const number = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    try {
      const result = calculatePlanting(values);
      output.className = 'planting-result';
      output.innerHTML = `<span class="eyebrow">РЕЗУЛЬТАТ ПО ВАШЕЙ СХЕМЕ</span><strong>${number(result.total)} саженцев</strong><dl><div><dt>Рядов на одной грядке</dt><dd>${number(result.rows)}</dd></div><div><dt>Растений в ряду</dt><dd>${number(result.plantsPerRow)}</dd></div><div><dt>Грядок</dt><dd>${number(result.beds)}</dd></div><div><dt>Площадь грядок</dt><dd>${number(result.area)} м²</dd></div><div><dt>Общая длина рядов</dt><dd>${number(result.rowLength)} м</dd></div></dl><p>${result.total ? 'Расчёт показывает вместимость по введённой геометрии, а не подходящую для сорта схему.' : 'При выбранных размерах не помещается полный ряд или ни одно растение в ряду. Проверьте расстояния и размеры.'}</p>`;
    } catch (error) {
      output.className = 'planting-result planting-error';
      output.textContent = error.message;
    }
    output.hidden = false;
    output.focus();
  });
}
