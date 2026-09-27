import {
  JOURNAL_STORAGE_KEY,
  makeJournalRecord,
  mergeJournalRecords,
  parseJournalFile,
  serializeJournalFile
} from './journal-model.mjs';

const form = document.querySelector('#grower-journal-form');
const list = document.querySelector('#grower-journal-list');
const status = document.querySelector('#grower-journal-status');
const count = document.querySelector('#grower-journal-count');
const moreButton = document.querySelector('#grower-journal-more');
const importInput = document.querySelector('#grower-journal-import');

if (form && list && status && count && moreButton && importInput) {
  const params = new URLSearchParams(location.search);
  const title = document.querySelector('#grower-journal-form-title');
  const cancel = document.querySelector('#grower-journal-cancel');
  const continueButton = document.querySelector('#grower-journal-continue');
  const extra = document.querySelector('#grower-journal-extra');
  const exportButton = document.querySelector('#grower-journal-export');
  let records = [];
  let editingId = '';
  let readable = true;
  let visibleCount = 4;

  function announce(message, error = false) {
    status.textContent = message;
    status.dataset.error = String(error);
  }

  function setStep(step) {
    form.dataset.step = step;
    continueButton.hidden = step !== 'start';
    for (const name of ['cultivar', 'region', 'season']) form.elements[name].disabled = step === 'start';
  }

  function continueEntry() {
    if (!form.elements.crop.reportValidity()) return;
    updateCultivarHint();
    setStep('details');
    title.textContent = `Запись о ${form.elements.crop.value === 'raspberry' ? 'малине' : 'клубнике'}`;
    form.elements.cultivar.focus();
  }

  function updateCultivarHint() {
    const raspberry = form.elements.crop.value !== 'strawberry';
    form.elements.cultivar.placeholder = raspberry ? 'Например, Гусар' : 'Например, Азия';
    form.elements.cultivar.setAttribute('list', `journal-${raspberry ? 'raspberry' : 'strawberry'}-varieties`);
  }

  function persist(next) {
    const json = serializeJournalFile(next);
    localStorage.setItem(JOURNAL_STORAGE_KEY, json);
    records = next;
    render();
  }

  function addDetail(dl, label, value) {
    if (value === '' || value == null) return;
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = String(value);
    dl.append(dt, dd);
  }

  function dateLabel(value) {
    return value ? new Intl.DateTimeFormat('ru-RU', { timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`)) : '';
  }

  function render() {
    list.replaceChildren();
    const lastTwo = records.length % 100;
    const lastDigit = records.length % 10;
    const countLabel = lastTwo >= 11 && lastTwo <= 14 ? 'записей' : lastDigit === 1 ? 'запись' : lastDigit >= 2 && lastDigit <= 4 ? 'записи' : 'записей';
    count.textContent = records.length === 0 ? 'Записей пока нет' : `${records.length} ${countLabel}`;
    exportButton.disabled = records.length === 0;
    const remaining = Math.max(0, records.length - visibleCount);
    moreButton.hidden = remaining === 0;
    moreButton.textContent = `Показать ещё ${Math.min(8, remaining)}`;
    if (records.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'grower-journal-empty';
      empty.textContent = 'Начните с сорта, региона и сезона. Наблюдения можно дописать позже.';
      list.append(empty);
      return;
    }
    for (const record of [...records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, visibleCount)) {
      const article = document.createElement('article');
      article.className = 'grower-journal-entry';
      article.id = `journal-entry-${record.id}`;
      article.tabIndex = -1;
      const eyebrow = document.createElement('span');
      eyebrow.className = 'eyebrow';
      eyebrow.textContent = `${record.crop === 'raspberry' ? 'Малина' : 'Клубника'} / ${record.season}`;
      const heading = document.createElement('h3');
      heading.textContent = record.cultivar;
      const region = document.createElement('p');
      region.className = 'grower-journal-region';
      region.textContent = record.region;
      let continuation = null;
      if (record.parentId) {
        continuation = document.createElement('p');
        continuation.className = 'grower-journal-continuation';
        continuation.textContent = 'Продолжение прошлой записи';
      }
      const details = document.createElement('dl');
      details.className = 'grower-journal-details';
      addDetail(details, 'Выращивание', { open: 'Открытый грунт', tunnel: 'Туннель', greenhouse: 'Теплица', container: 'Контейнер', other: 'Другой способ' }[record.setting]);
      addDetail(details, 'Посадка', dateLabel(record.plantingDate));
      addDetail(details, 'Растений', record.plantCount == null ? '' : `${record.plantCount} шт.`);
      addDetail(details, 'Посадочный материал', record.sourceMaterial);
      addDetail(details, 'Раньше росло', record.predecessor);
      addDetail(details, 'Условия', record.conditions);
      addDetail(details, 'Зимовка', record.winterDate ? `${dateLabel(record.winterDate)}${record.winterLoss == null ? '' : ` · потери ${record.winterLoss} шт.`}` : '');
      addDetail(details, 'Наблюдение', record.wintering);
      addDetail(details, 'Сбор', record.harvestDate ? `${dateLabel(record.harvestDate)}${record.harvestKg == null ? '' : ` · ${new Intl.NumberFormat('ru-RU').format(record.harvestKg)} кг`}${record.harvestMethod === 'unknown' ? '' : ` · ${record.harvestMethod === 'weighed' ? 'взвешено' : 'оценка'}`}` : '');
      addDetail(details, 'Заметки', record.notes);
      const actions = document.createElement('div');
      actions.className = 'grower-journal-actions';
      for (const [action, label] of [['edit', 'Изменить'], ['repeat', 'Новый сезон'], ['delete', 'Удалить']]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.action = action;
        button.dataset.id = record.id;
        button.textContent = label;
        actions.append(button);
      }
      article.append(eyebrow, heading, region);
      if (continuation) article.append(continuation);
      article.append(details, actions);
      list.append(article);
    }
  }

  function resetForm() {
    editingId = '';
    delete form.dataset.parentId;
    form.reset();
    setStep('start');
    if (extra) extra.open = false;
    form.elements.season.value = String(new Date().getFullYear());
    updateCultivarHint();
    title.textContent = 'Новая запись';
    cancel.hidden = true;
    cancel.textContent = 'Отменить изменение';
  }

  function fillForm(record) {
    setStep('details');
    if (extra) extra.open = true;
    for (const [key, value] of Object.entries(record)) {
      const input = form.elements.namedItem(key);
      if (input && typeof input.value === 'string') input.value = value == null ? '' : String(value);
    }
    updateCultivarHint();
    form.elements.cultivar.focus();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  try {
    const saved = localStorage.getItem(JOURNAL_STORAGE_KEY);
    records = saved ? parseJournalFile(saved).records : [];
    render();
  } catch {
    readable = false;
    form.querySelector('fieldset').disabled = true;
    render();
    announce('Не удалось открыть локальные записи. Проверьте доступ браузера к хранилищу или импортируйте свою копию журнала.', true);
  }

  resetForm();
  const cropParam = params.get('crop');
  const cultivarParam = params.get('cultivar');
  const regionParam = params.get('region');
  if (cropParam === 'raspberry' || cropParam === 'strawberry') {
    form.elements.crop.value = cropParam;
    updateCultivarHint();
  }
  if (cultivarParam && cultivarParam.length <= 100) form.elements.cultivar.value = cultivarParam;
  if (regionParam && regionParam.length <= 100) form.elements.region.value = regionParam;
  if (cropParam === 'raspberry' || cropParam === 'strawberry') {
    setStep('details');
    title.textContent = `Запись о ${cropParam === 'raspberry' ? 'малине' : 'клубнике'}`;
  }
  const entryParam = params.get('entry');
  if (entryParam && readable) {
    const ordered = [...records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const index = ordered.findIndex(record => record.id === entryParam);
    if (index >= 0) {
      visibleCount = Math.max(visibleCount, index + 1);
      render();
      requestAnimationFrame(() => document.getElementById(`journal-entry-${entryParam}`)?.focus());
    } else {
      announce('Этой записи нет в журнале этого браузера.', true);
    }
  }

  continueButton.addEventListener('click', continueEntry);

  form.elements.crop.addEventListener('change', () => {
    form.elements.cultivar.value = '';
    updateCultivarHint();
    if (form.dataset.step === 'details' && !editingId && !form.dataset.parentId) {
      title.textContent = `Запись о ${form.elements.crop.value === 'raspberry' ? 'малине' : 'клубнике'}`;
    }
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!readable) return;
    if (form.dataset.step === 'start') { continueEntry(); return; }
    try {
      const previous = records.find(record => record.id === editingId) ?? null;
      const raw = Object.fromEntries(new FormData(form));
      const id = crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
      const record = makeJournalRecord({ ...raw, parentId: form.dataset.parentId || '' }, { id, previous });
      persist(previous ? records.map(item => item.id === previous.id ? record : item) : [...records, record]);
      resetForm();
      announce('Запись сохранена в этом браузере.');
    } catch (error) { announce(error.message || 'Не удалось сохранить запись.', true); }
  });

  cancel.addEventListener('click', () => { resetForm(); announce('Изменение отменено.'); });

  moreButton.addEventListener('click', () => {
    const firstNewRecord = visibleCount;
    visibleCount += 8;
    render();
    list.children[firstNewRecord]?.focus();
  });

  list.addEventListener('click', event => {
    const button = event.target.closest('button[data-action][data-id]');
    if (!button) return;
    const source = records.find(record => record.id === button.dataset.id);
    if (!source) return;
    try {
      if (button.dataset.action === 'edit') {
        editingId = source.id;
        title.textContent = `Изменить: ${source.cultivar}`;
        cancel.hidden = false;
        fillForm(source);
        announce('Измените поля и сохраните запись.');
      } else if (button.dataset.action === 'repeat') {
        if (source.season >= 2100) throw new Error('Для нового сезона укажите год до 2100');
        editingId = '';
        resetForm();
        fillForm({ ...source, season: source.season + 1, parentId: source.id, winterDate: '', winterLoss: null, wintering: '', harvestDate: '', harvestKg: null, harvestMethod: 'unknown', notes: '' });
        form.dataset.parentId = source.id;
        title.textContent = `Новый сезон: ${source.cultivar}`;
        cancel.hidden = false;
        cancel.textContent = 'Отменить новый сезон';
        announce('Условия перенесены; добавьте наблюдения нового сезона и сохраните.');
      } else if (button.dataset.action === 'delete') {
        if (!confirm(`Удалить запись «${source.cultivar}», сезон ${source.season}?`)) return;
        persist(records.filter(record => record.id !== source.id));
        if (editingId === source.id) resetForm();
        announce('Запись удалена.');
      }
    } catch (error) { announce(error.message || 'Не удалось изменить запись.', true); }
  });

  exportButton.addEventListener('click', () => {
    try {
      const url = URL.createObjectURL(new Blob([serializeJournalFile(records)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `malina-journal-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      announce('Файл журнала подготовлен.');
    } catch (error) { announce(error.message || 'Не удалось создать файл.', true); }
  });

  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('Файл журнала слишком велик');
      const incoming = parseJournalFile(await file.text()).records;
      const merged = mergeJournalRecords(readable ? records : [], incoming);
      persist(merged.records);
      readable = true;
      form.querySelector('fieldset').disabled = false;
      announce(`Импортировано ${merged.added} записей. Уже имеющихся: ${merged.skipped}.`);
    } catch (error) { announce(error.message || 'Не удалось импортировать файл.', true); }
    importInput.value = '';
  });
}
