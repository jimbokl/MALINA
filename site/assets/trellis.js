import { calculateTrellis, calculateTrellisCost } from './trellis-model.mjs';

const form = document.querySelector('#trellis-form');
if (form) {
  const output = document.querySelector('#trellis-result');
  const number = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const input = Object.fromEntries(new FormData(form));
      const result = calculateTrellis(input);
      const hasPrices = ['endPostPrice', 'intermediatePostPrice', 'wirePrice'].some(key => String(input[key]).trim() !== '');
      const cost = hasPrices ? calculateTrellisCost(result, input) : null;
      output.className = 'planting-result';
      output.innerHTML = `<span class="eyebrow">МАТЕРИАЛЫ ПО ВАШИМ РАЗМЕРАМ</span><strong>${number(result.totalPosts)} опор</strong><dl><div><dt>Концевые опоры</dt><dd>${number(result.endPosts)}</dd></div><div><dt>Промежуточные опоры</dt><dd>${number(result.intermediatePosts)}</dd></div><div><dt>Пролётов на ряд</dt><dd>${number(result.spansPerRow)}</dd></div><div><dt>Фактическая длина пролёта</dt><dd>${number(result.actualSpan)} м</dd></div><div><dt>Проволока без запаса</dt><dd>${number(result.wireLength)} м</dd></div></dl>${cost ? `<h3>Смета материалов: ${number(cost.total)} ₽</h3><dl><div><dt>Концевые опоры: ${number(result.endPosts)} × ${number(Number(String(input.endPostPrice).replace(',', '.')))} ₽</dt><dd>${number(cost.endPosts)} ₽</dd></div><div><dt>Промежуточные опоры: ${number(result.intermediatePosts)} × ${number(Number(String(input.intermediatePostPrice).replace(',', '.')))} ₽</dt><dd>${number(cost.intermediatePosts)} ₽</dd></div><div><dt>Проволока: ${number(result.wireLength)} м × ${number(Number(String(input.wirePrice).replace(',', '.')))} ₽/м</dt><dd>${number(cost.wire)} ₽</dd></div></dl>` : '<p>Добавьте свои цены, чтобы получить смету материалов.</p>'}<p>Проволока указана без запаса. Смета не включает крепёж, анкеры, растяжки, доставку и работу. Несущую способность конструкции расчёт не проверяет.</p>`;
    } catch (error) {
      output.className = 'planting-result planting-error';
      output.textContent = error.message;
    }
    output.hidden = false;
    output.focus();
  });
}
