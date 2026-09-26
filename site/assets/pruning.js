import { pruningAdvice } from './pruning-model.mjs';

const form = document.querySelector('#pruning-form');
if (form) {
  const harvest = document.querySelector('#pruning-harvest');
  const result = document.querySelector('#pruning-result');
  const update = () => {
    const selected = form.elements.type.value;
    harvest.hidden = selected !== 'primocane';
    harvest.disabled = selected !== 'primocane';
    result.hidden = true;
  };
  form.addEventListener('change', update);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const advice = pruningAdvice({ type: form.elements.type.value, harvest: form.elements.harvest.value });
    result.replaceChildren();
    const eyebrow = document.createElement('span'); eyebrow.className = 'eyebrow'; eyebrow.textContent = 'ПЛАН ДЛЯ ВАШЕГО ВЫБОРА';
    const title = document.createElement('h2'); title.textContent = advice.title;
    const summary = document.createElement('p'); summary.className = 'pruning-summary'; summary.textContent = advice.summary;
    const list = document.createElement('ol');
    for (const step of advice.steps) { const item = document.createElement('li'); item.textContent = step; list.append(item); }
    const link = document.createElement('a'); link.className = 'text-link'; link.href = advice.article; link.textContent = `${advice.articleLabel} ↗`;
    result.append(eyebrow, title, summary, list, link);
    result.hidden = false;
    result.focus();
  });
  update();
}
