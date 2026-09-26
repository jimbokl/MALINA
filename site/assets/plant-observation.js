import { evaluateObservation } from './plant-observation-model.mjs';

const form = document.querySelector('#plant-observation-form');
const result = document.querySelector('#plant-observation-result');
const patternField = document.querySelector('#plant-pattern-field');
if (form && result && patternField) {
  const updateFields = () => { patternField.hidden = form.elements.symptom.value !== 'yellow'; };
  form.elements.symptom.addEventListener('change', updateFields);
  updateFields();
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    data.pattern ||= 'unknown';
    const answer = evaluateObservation(data);
    result.replaceChildren();
    const heading = document.createElement('h2');
    heading.textContent = answer.title;
    const summary = document.createElement('p');
    summary.className = 'observation-summary';
    summary.textContent = answer.summary;
    const list = document.createElement('ol');
    for (const step of answer.steps) {
      const item = document.createElement('li');
      item.textContent = step;
      list.append(item);
    }
    const possibilities = document.createElement('p');
    possibilities.textContent = answer.possibilities;
    const limit = document.createElement('p');
    limit.className = 'observation-limit';
    limit.textContent = answer.limitation;
    const label = document.createElement('h3');
    label.textContent = 'Основания для проверки';
    const sources = document.createElement('ul');
    for (const source of answer.sources) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = `${source.label} ↗`;
      item.append(link);
      sources.append(item);
    }
    result.append(heading, summary, list, possibilities, limit, label, sources);
    result.hidden = false;
    result.focus();
  });
}
