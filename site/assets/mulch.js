import { compareMulch, mulchSources } from './mulch-model.mjs';

const form = document.querySelector('#mulch-form');
if (form) {
  const result = document.querySelector('#mulch-result');
  const systemField = document.querySelector('#mulch-system-field');
  form.elements.crop.addEventListener('change', () => { systemField.hidden = form.elements.crop.value !== 'strawberry'; result.hidden = true; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const advice = compareMulch({ crop: form.elements.crop.value, system: form.elements.system.value, goal: form.elements.goal.value });
    const heading = document.createElement('h2'); heading.textContent = advice.title;
    const context = document.createElement('p'); context.textContent = advice.context;
    const cards = document.createElement('div'); cards.className = 'mulch-options';
    for (const option of advice.options) {
      const card = document.createElement('article'); card.className = 'mulch-option';
      if (option.status) { const status = document.createElement('span'); status.className = 'eyebrow'; status.textContent = option.status; card.append(status); }
      const title = document.createElement('h3'); title.textContent = option.material;
      card.append(title);
      for (const [label, value] of [['Зачем', option.benefit], ['Что делать', option.maintenance], ['Граница', option.limit]]) {
        const paragraph = document.createElement('p'); const strong = document.createElement('strong'); strong.textContent = `${label}: `; paragraph.append(strong, document.createTextNode(value)); card.append(paragraph);
      }
      const source = document.createElement('a'); source.href = mulchSources[option.source].url; source.textContent = `Открыть источник: ${mulchSources[option.source].label} ↗`; source.target = '_blank'; source.rel = 'noopener noreferrer'; card.append(source); cards.append(card);
    }
    if (advice.source) { const source = document.createElement('a'); source.href = mulchSources[advice.source].url; source.textContent = `Основание: ${mulchSources[advice.source].label} ↗`; source.target = '_blank'; source.rel = 'noopener noreferrer'; cards.append(source); }
    const next = document.createElement('a'); next.href = advice.next.url; next.textContent = `${advice.next.label} →`; next.className = 'text-link';
    result.replaceChildren(heading, context, cards, next); result.hidden = false; result.focus();
  });
}
