import { comparisonHref, getComparisonFacts, parseSelection, toggleSelection } from './comparison-model.mjs';

  const root = document.querySelector('#comparison');
if (root) {
  const varieties = JSON.parse(document.querySelector('#comparison-data').textContent);
  const cropKey = root.dataset.crop;
  const params = new URLSearchParams(location.search);
  const hasSharedSelection = params.has('sort');
  let selection = hasSharedSelection
    ? parseSelection(params.get('sort'), varieties, cropKey)
    : varieties.slice(0, 4).map(item => item.slug);
  const choices = [...root.querySelectorAll('input[name="cultivar"]')];
  const status = root.querySelector('#comparison-status');
  const head = root.querySelector('.comparison-table thead tr');
  const body = root.querySelector('#comparison-rows');
  const table = root.querySelector('.comparison-table');
  const context = root.querySelector('#comparison-context');
  const siteBase = document.documentElement.dataset.siteBase || '';
  const verbForms = count => count === 1 ? 'сорт' : count > 1 && count < 5 ? 'сорта' : 'сортов';
  let notice = '';
  const city = (params.get('city') || '').trim();
  const region = (params.get('region') || '').trim();
  if (city || region) {
    context.hidden = false;
    context.textContent = `Контекст места: ${[city, region].filter(Boolean).join(', ')}. Он помогает сохранить ваш выбор, но сам по себе не подтверждает пригодность сортов.`;
  }

  function update() {
    choices.forEach(input => { input.checked = selection.includes(input.value); });
    const selected = selection.map(slug => varieties.find(item => item.slug === slug)).filter(Boolean);
    status.textContent = notice || (selected.length < 2
      ? 'Выберите ещё хотя бы один сорт. Можно отметить до четырёх сортов одной культуры.'
      : `Выбрано ${selected.length} ${verbForms(selected.length)}. Ссылку можно скопировать и отправить.`);
    head.replaceChildren();
    const firstHead = document.createElement('th');
    firstHead.scope = 'col';
    firstHead.textContent = 'Параметр';
    head.append(firstHead);
    for (const item of selected) {
      const th = document.createElement('th');
      th.scope = 'col';
      const link = document.createElement('a');
      link.href = `${siteBase}/sorta/${encodeURIComponent(item.slug)}/`;
      link.textContent = item.name;
      const latin = document.createElement('small');
      latin.textContent = item.latin;
      th.append(link, latin);
      head.append(th);
    }
    body.replaceChildren();
    const factRows = selected.map(item => getComparisonFacts(item));
    for (let index = 0; index < getComparisonFacts(varieties[0]).length; index++) {
      const tr = document.createElement('tr');
      const label = document.createElement('th');
      label.scope = 'row';
      label.textContent = getComparisonFacts(varieties[0])[index][0];
      tr.append(label);
      for (let column = 0; column < selected.length; column++) {
        const item = selected[column];
        const td = document.createElement('td');
        td.append(document.createTextNode(factRows[column][index][1] || 'Нет проверенных данных'));
        const source = document.createElement('a');
        source.className = 'comparison-source';
        source.href = item.source;
        source.target = '_blank';
        source.rel = 'noopener noreferrer';
        source.textContent = `${item.sourceLabel} · проверено ${root.dataset.reviewedAt} ↗`;
        td.append(source);
        tr.append(td);
      }
      body.append(tr);
    }
    table.hidden = selected.length < 2;
    const next = comparisonHref(cropKey, selection, location.search, siteBase);
    history.replaceState(null, '', next);
  }

  for (const input of choices) {
    input.addEventListener('change', () => {
      const result = toggleSelection(selection, input.value, varieties, cropKey);
      selection = result.selection;
      notice = result.reason === 'limit' ? 'Можно сравнить не более четырёх сортов одновременно.' : '';
      update();
    });
  }
  update();
}
