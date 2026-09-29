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
    const usedSources = new Set();
    for (const option of advice.options) {
      const card = document.createElement('article'); card.className = 'mulch-option';
      if (option.status) { const status = document.createElement('span'); status.className = 'eyebrow'; status.textContent = option.status; card.append(status); }
      const title = document.createElement('h3'); title.textContent = option.material;
      card.append(title);
      for (const [label, value] of [['Чем поможет', option.benefit], ['Что делать', option.maintenance], ['На что обратить внимание', option.limit]]) {
        const paragraph = document.createElement('p'); const strong = document.createElement('strong'); strong.textContent = `${label}: `; paragraph.append(strong, document.createTextNode(value)); card.append(paragraph);
      }
      usedSources.add(option.source);
      cards.append(card);
    }
    if (advice.source) usedSources.add(advice.source);
    const next = document.createElement('a'); next.href = advice.next.url; next.textContent = `${advice.next.label} →`; next.className = 'text-link';
    const sources = document.createElement('details');
    const summary = document.createElement('summary'); summary.textContent = 'Источники и подробности';
    const list = document.createElement('ul');
    for (const key of usedSources) {
      const item = mulchSources[key];
      if (!item) continue;
      const row = document.createElement('li');
      const link = document.createElement('a'); link.href = item.url; link.textContent = item.label; link.target = '_blank'; link.rel = 'noopener noreferrer';
      row.append(link); list.append(row);
    }
    sources.append(summary, list);
    result.replaceChildren(heading, context, cards, next, sources); result.hidden = false; result.focus();
  });
}
