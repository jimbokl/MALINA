import { makeCalendar, calendarSources } from './calendar-model.mjs';
import { JOURNAL_STORAGE_KEY, journalCalendarEvents, parseJournalFile } from './journal-model.mjs';

const form = document.querySelector('#calendar-form');
if (form) {
  const result = document.querySelector('#calendar-result');
  const typeField = form.querySelector('[name="type"]');
  const typeLabel = document.querySelector('#calendar-type-label');
  const schemeField = form.querySelector('#calendar-scheme-field');
  const frostField = form.querySelector('#calendar-frost-field');
  const journalSection = document.querySelector('#calendar-journal');
  const journalTitle = document.querySelector('#calendar-journal-title');
  const journalList = document.querySelector('#calendar-journal-list');
  const journalEmpty = document.querySelector('#calendar-journal-empty');
  const journalMore = document.querySelector('#calendar-journal-more');
  const journalLink = document.querySelector('#calendar-journal-link');
  const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  let showAllJournalEvents = false;

  function renderJournalEvents() {
    if (!journalSection || !journalTitle || !journalList || !journalEmpty || !journalMore || !journalLink) return;
    const crop = form.elements.crop.value;
    journalLink.href = `/instrumenty/zhurnal-uchastka/?crop=${crop}`;
    journalList.replaceChildren();
    let events;
    try {
      const stored = localStorage.getItem(JOURNAL_STORAGE_KEY);
      events = stored ? journalCalendarEvents(parseJournalFile(stored).records, crop) : [];
    } catch {
      journalSection.dataset.empty = 'true';
      journalTitle.textContent = 'Ваши даты';
      journalEmpty.textContent = 'Не удалось прочитать записи. Откройте журнал участка, чтобы проверить данные.';
      journalEmpty.hidden = false;
      journalMore.hidden = true;
      return;
    }
    journalSection.dataset.empty = String(events.length === 0);
    journalTitle.textContent = events.length === 0 ? 'Запомните даты сезона'
      : crop === 'raspberry' ? 'Ваши даты по малине' : 'Ваши даты по клубнике';
    journalLink.textContent = events.length === 0 ? 'Записать дату →' : 'Открыть журнал участка →';
    journalEmpty.hidden = events.length > 0;
    if (events.length === 0) journalEmpty.textContent = 'Посадили растение или собрали ягоды? Запишите дату — она появится здесь.';
    const visible = showAllJournalEvents ? events : events.slice(0, 12);
    for (const entry of visible) {
      const item = document.createElement('li');
      const time = document.createElement('time');
      time.dateTime = entry.date;
      time.textContent = dateFormat.format(new Date(`${entry.date}T00:00:00Z`));
      const title = document.createElement('strong');
      title.textContent = entry.kind === 'planting' ? 'Посадка' : 'Сбор';
      const detail = document.createElement('span');
      const amount = entry.kind === 'harvest' && entry.harvestKg != null
        ? ` · ${new Intl.NumberFormat('ru-RU').format(entry.harvestKg)} кг${entry.harvestMethod === 'estimated' ? ' (оценка)' : ''}`
        : '';
      detail.textContent = `${entry.cultivar} · ${entry.region}${amount}`;
      const link = document.createElement('a');
      link.href = `/instrumenty/zhurnal-uchastka/?entry=${encodeURIComponent(entry.id)}`;
      link.textContent = 'Открыть запись →';
      item.append(time, title, detail, link);
      journalList.append(item);
    }
    journalMore.hidden = events.length <= 12;
    journalMore.textContent = showAllJournalEvents ? 'Свернуть даты' : `Показать все даты (${events.length})`;
  }

  function updateForm() {
    const crop = form.elements.crop.value;
    if (typeLabel) typeLabel.textContent = crop === 'raspberry' ? 'Какая у вас малина?' : 'Какая у вас клубника?';
    const previous = typeField.value;
    typeField.replaceChildren();
    const choices = crop === 'raspberry'
      ? [['unknown', 'Пока не знаю'], ['summer', 'Летняя малина'], ['primocane', 'Ремонтантная малина']]
      : [['unknown', 'Пока не знаю'], ['june', 'Один летний урожай'], ['day-neutral', 'Плодоносит долго']];
    for (const [value, label] of choices) typeField.add(new Option(label, value));
    if (choices.some(([value]) => value === previous)) typeField.value = previous;
    schemeField.hidden = crop !== 'raspberry' || typeField.value !== 'primocane';
    schemeField.querySelector('select').disabled = schemeField.hidden;
    frostField.hidden = form.elements.phase.value !== 'flowers';
    frostField.querySelector('input').disabled = frostField.hidden;
    result.hidden = true;
    showAllJournalEvents = false;
    renderJournalEvents();
  }
  form.elements.crop.addEventListener('change', updateForm);
  typeField.addEventListener('change', updateForm);
  form.elements.phase.addEventListener('change', updateForm);
  journalMore?.addEventListener('click', () => { showAllJournalEvents = !showAllJournalEvents; renderJournalEvents(); });
  window.addEventListener('storage', event => { if (event.key === JOURNAL_STORAGE_KEY) renderJournalEvents(); });
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
    const check = document.createElement('p'); check.textContent = plan.current.check;
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
    const season = document.createElement('details'); season.className = 'calendar-sequence';
    const seasonTitle = document.createElement('summary'); seasonTitle.textContent = 'Посмотреть весь сезон';
    season.append(seasonTitle, trail, next);
    const catalog = document.createElement('a'); catalog.className = 'text-link'; catalog.href = plan.crop === 'raspberry' ? '/sorta/?crop=raspberry' : '/sorta/?crop=strawberry'; catalog.textContent = 'Уточнить сорт в каталоге →';
    const pruning = document.createElement('a'); pruning.className = 'text-link'; pruning.href = '/instrumenty/obrezka-maliny/'; pruning.textContent = 'Открыть схему обрезки →';
    result.replaceChildren(eyebrow, heading, check, action, ...(plan.current.caveat ? [caveat] : []), ...(plan.uncertainty ? [uncertainty] : []), source, season, catalog, ...(plan.crop === 'raspberry' && ['after', 'dormant'].includes(plan.phase) ? [pruning] : []));
    result.hidden = false;
    result.focus();
  });
}
