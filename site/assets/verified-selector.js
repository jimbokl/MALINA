const form = document.querySelector('#verified-form');

if (form) {
  const base = document.documentElement.dataset.siteBase || '';
  const regionSelect = form.querySelector('#verified-region');
  const submitButton = form.querySelector('button[type="submit"]');
  const output = document.querySelector('#verified-output');
  const status = document.querySelector('#verified-status');
  const results = document.querySelector('#verified-results');
  let catalogText;
  let engine;

  const showStatus = message => {
    output.hidden = false;
    status.textContent = message;
    results.replaceChildren();
  };

  async function loadCatalog() {
    try {
      const response = await fetch(`${base}/data/catalog.json`);
      if (!response.ok) throw new Error('catalog fetch failed');
      catalogText = await response.text();
      const catalog = JSON.parse(catalogText);
      if (catalog.schema_version !== 1 || !Array.isArray(catalog.regions) || !catalog.regions.length) {
        throw new Error('catalog schema is unavailable');
      }
      regionSelect.replaceChildren();
      for (const region of catalog.regions) {
        if (typeof region.code !== 'string' || typeof region.name_ru !== 'string') {
          throw new Error('catalog region is incomplete');
        }
        regionSelect.add(new Option(region.name_ru, region.code));
      }
      regionSelect.disabled = false;
      submitButton.disabled = false;
    } catch {
      showStatus('Список проверенных регионов сейчас недоступен. Справочные карточки выше можно просмотреть отдельно.');
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!catalogText || !regionSelect.value) return;
    submitButton.disabled = true;
    showStatus('Проверяем опубликованные правила для выбранного региона…');
    try {
      if (!engine) {
        const module = await import(`${base}/assets/selector/malina_selector.js`);
        await module.default();
        engine = module.select_varieties;
      }
      const crop = form.querySelector('#verified-crop').value;
      const query = { region_code: regionSelect.value };
      if (crop) query.crop_slug = crop;
      const selection = JSON.parse(engine(catalogText, JSON.stringify(query)));
      if (selection.error) throw new Error(selection.error.message);
      if (selection.total === 0) {
        showStatus('Для выбранного региона пока нет проверенных рекомендаций. Это не означает, что перечисленные выше сорта непригодны: региональных данных для них ещё нет.');
        return;
      }
      status.textContent = `${selection.total} ${selection.total === 1 ? 'сорт с проверенным региональным правилом' : 'сорта с проверенными региональными правилами'}. Читайте основания и ограничения каждого правила.`;
      results.replaceChildren();
      for (const match of selection.matches) {
        const item = document.createElement('li');
        const heading = document.createElement('h3');
        heading.textContent = match.canonical_name;
        item.append(heading);
        for (const reason of match.reasons) {
          const rationale = document.createElement('p');
          rationale.textContent = reason.rationale;
          const limits = document.createElement('p');
          limits.textContent = `Ограничения: ${reason.limitations}`;
          const source = document.createElement('small');
          source.textContent = `Источник в каталоге: ${reason.source_key}`;
          item.append(rationale, limits, source);
        }
        results.append(item);
      }
    } catch {
      showStatus('Не удалось проверить региональные рекомендации. Попробуйте обновить страницу позже; справочный каталог доступен отдельно.');
    } finally {
      submitButton.disabled = false;
    }
  });

  loadCatalog();
}
