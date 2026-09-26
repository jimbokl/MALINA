import { calculateTrellis } from './trellis-model.mjs';

const form = document.querySelector('#trellis-form');
if (form) {
  const output = document.querySelector('#trellis-result');
  const number = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const result = calculateTrellis(Object.fromEntries(new FormData(form)));
      output.className = 'planting-result';
      output.innerHTML = `<span class="eyebrow">МАТЕРИАЛЫ ПО ВАШИМ РАЗМЕРАМ</span><strong>${number(result.totalPosts)} опор</strong><dl><div><dt>Концевые опоры</dt><dd>${number(result.endPosts)}</dd></div><div><dt>Промежуточные опоры</dt><dd>${number(result.intermediatePosts)}</dd></div><div><dt>Пролётов на ряд</dt><dd>${number(result.spansPerRow)}</dd></div><div><dt>Фактическая длина пролёта</dt><dd>${number(result.actualSpan)} м</dd></div><div><dt>Проволока без запаса</dt><dd>${number(result.wireLength)} м</dd></div></dl><p>Добавьте запас проволоки на крепление и натяжение по своей конструкции. Несущую способность опор, анкеры и крепёж расчёт не проверяет.</p>`;
    } catch (error) {
      output.className = 'planting-result planting-error';
      output.textContent = error.message;
    }
    output.hidden = false;
    output.focus();
  });
}
