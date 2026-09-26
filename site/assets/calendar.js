import { makeCalendar, calendarSources } from './calendar-model.mjs';

const form = document.querySelector('#calendar-form');
if (form) {
  const result = document.querySelector('#calendar-result');
  const typeField = form.querySelector('[name="type"]');
  const schemeField = form.querySelector('#calendar-scheme-field');
  const frostField = form.querySelector('#calendar-frost-field');

  function updateForm() {
    const crop = form.elements.crop.value;
    const previous = typeField.value;
    typeField.replaceChildren();
    const choices = crop === 'raspberry'
      ? [['unknown', 'Пока не знаю'], ['summer', 'Летняя малина'], ['primocane', 'Ремонтантная малина']]
      : [['unknown', 'Пока не знаю'], ['june', 'Однократный летний сбор'], ['day-neutral', 'Нейтральнодневная клубника']];
    for (const [value, label] of choices) typeField.add(new Option(label, value));
    if (choices.some(([value]) => value === previous)) typeField.value = previous;
    schemeField.hidden = crop !== 'raspberry' || typeField.value !== 'primocane';
    schemeField.querySelector('select').disabled = schemeField.hidden;
    frostField.hidden = form.elements.phase.value !== 'flowers';
    frostField.querySelector('input').disabled = frostField.hidden;
    result.hidden = true;
  }
  form.elements.crop.addEventListener('change', updateForm);
  typeField.addEventListener('change', updateForm);
  form.elements.phase.addEventListener('change', updateForm);
  updateForm();

  form.addEventListener('submit', event => {
    event.preventDefault();
    const plan = makeCalendar({
      crop: form.elements.crop.value,
      type: typeField.value,
      scheme: form.elements.scheme.value,
      phase: form.elements.phase.value,
      frostForecast: form.elements.frostForecast.checked
    });
    const eyebrow = document.createElement('span'); eyebrow.className = 'eyebrow'; eyebrow.textContent = `СЕЙЧАС / ${plan.phaseLabel.toUpperCase()}`;
    const heading = document.createElement('h2'); heading.textContent = plan.current.title;
    const check = document.createElement('p'); check.append(document.createElement('strong'), document.createTextNode(plan.current.check)); check.firstChild.textContent = 'Проверьте: ';
    const action = document.createElement('p'); action.append(document.createElement('strong'), document.createTextNode(plan.current.action)); action.firstChild.textContent = 'Следующий шаг: ';
    const caveat = document.createElement('p'); caveat.className = 'calendar-caveat'; caveat.textContent = plan.current.caveat;
    const uncertainty = document.createElement('p'); uncertainty.className = 'calendar-uncertainty'; uncertainty.textContent = plan.uncertainty;
    const source = document.createElement('a'); source.href = calendarSources[plan.current.source].url; source.target = '_blank'; source.rel = 'noopener noreferrer'; source.textContent = `Основание: ${calendarSources[plan.current.source].label} ↗`;
    const trail = document.createElement('ol'); trail.className = 'calendar-timeline'; trail.setAttribute('aria-label', 'Последовательность событий');
    for (const entry of plan.sequence) {
      const step = document.createElement('li'); step.className = `calendar-${entry.state}`; step.textContent = entry.label;
      if (entry.state === 'current') step.setAttribute('aria-current', 'step');
      trail.append(step);
    }
    const next = document.createElement('p'); next.className = 'calendar-next'; next.textContent = plan.next ? `Следите за следующим событием: ${plan.next.label.toLowerCase()}.` : 'Цикл завершён: начните с осмотра нового роста или новой посадки.';
    const catalog = document.createElement('a'); catalog.className = 'text-link'; catalog.href = plan.crop === 'raspberry' ? '/sorta/?crop=raspberry' : '/sorta/?crop=strawberry'; catalog.textContent = 'Уточнить сорт в каталоге →';
    const pruning = document.createElement('a'); pruning.className = 'text-link'; pruning.href = '/instrumenty/obrezka-maliny/'; pruning.textContent = 'Открыть схему обрезки →';
    result.replaceChildren(eyebrow, heading, check, action, ...(plan.current.caveat ? [caveat] : []), ...(plan.uncertainty ? [uncertainty] : []), source, trail, next, catalog, ...(plan.crop === 'raspberry' ? [pruning] : []));
    result.hidden = false;
    result.focus();
  });
}
