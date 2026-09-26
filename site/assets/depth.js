import { depthAdvice } from './depth-model.mjs';

const form = document.querySelector('#depth-form');
if (form) {
  const position = form.elements.position;
  const result = document.querySelector('#depth-result');
  const options = {
    strawberry: [
      ['unknown', 'Пока не вижу основание сердечка'],
      ['aligned', 'Сердечко у поверхности, корни закрыты'],
      ['buried', 'Сердечко закрыто землёй или мульчей'],
      ['exposed', 'Вижу оголённые корни']
    ],
    raspberry: [
      ['unknown', 'Не вижу прежней отметки грунта или верхних корней'],
      ['aligned', 'Уровень у прежней отметки, корни закрыты'],
      ['buried', 'Прежняя отметка грунта оказалась под землёй'],
      ['exposed', 'Верхние корни видны над землёй']
    ]
  };
  function updatePositions() {
    const crop = form.elements.crop.value;
    position.replaceChildren(...options[crop].map(([value, label]) => new Option(label, value)));
    result.hidden = true;
  }
  form.elements.crop.addEventListener('change', updatePositions);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const advice = depthAdvice({ crop: form.elements.crop.value, stock: form.elements.stock.value, position: position.value });
    const heading = document.createElement('h2'); heading.textContent = advice.title;
    const summary = document.createElement('p'); summary.textContent = advice.summary;
    const list = document.createElement('ol');
    for (const step of advice.steps) { const item = document.createElement('li'); item.textContent = step; list.append(item); }
    result.className = `depth-result depth-${advice.status}`;
    result.replaceChildren(heading, summary, list);
    result.hidden = false;
    result.focus();
  });
  updatePositions();
}
