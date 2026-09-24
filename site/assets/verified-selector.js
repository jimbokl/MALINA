const form = document.querySelector('#picker-form');

if (form) {
  const base = document.documentElement.dataset.siteBase || '';
  const status = document.querySelector('#verified-status');
  const results = document.querySelector('#verified-results');
  let catalogPromise;
  let engine;

  const showStatus = message => {
    status.textContent = message;
    results.replaceChildren();
  };

  const loadCatalog = async () => {
    const response = await fetch(`${base}/data/catalog.json`);
    if (!response.ok) throw new Error('catalog fetch failed');
    const text = await response.text();
    const catalog = JSON.parse(text);
    if (catalog.schema_version !== 1 || !Array.isArray(catalog.regions)) {
      throw new Error('catalog schema is unavailable');
    }
    return { text, catalog };
  };

  const normalized = value => value.trim().toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const fields = new FormData(form);
    const regionName = String(fields.get('region') || '').trim();
    if (!regionName) return;
    const crop = String(fields.get('crop') || 'all');
    showStatus(`Проверяем опубликованные правила для региона «${regionName}»…`);

    try {
      catalogPromise ||= loadCatalog();
      const { text, catalog } = await catalogPromise;
      const region = catalog.regions.find(item => normalized(item.name_ru || '') === normalized(regionName));
      if (!region) {
        showStatus(`Для региона «${regionName}» пока нет проверенных рекомендаций. Сорта выше — справочное сравнение по признакам, а не региональный вывод.`);
        return;
      }
      if (!engine) {
        const module = await import(`${base}/assets/selector/malina_selector.js`);
        await module.default();
        engine = module.select_varieties;
      }
      const query = { region_code: region.code };
      if (crop !== 'all') query.crop_slug = crop;
      const selection = JSON.parse(engine(text, JSON.stringify(query)));
      if (selection.error) throw new Error(selection.error.message);
      if (selection.total === 0) {
        showStatus(`Для региона «${regionName}» пока нет проверенных рекомендаций. Это не означает, что сорта выше непригодны: региональных данных для них ещё нет.`);
        return;
      }
      status.textContent = `${selection.total} ${selection.total === 1 ? 'сорт с проверенным региональным правилом' : 'сорта с проверенными региональными правилами'} для региона «${regionName}». Читайте основания и ограничения каждого правила.`;
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
      catalogPromise = undefined;
      showStatus('Не удалось проверить региональные рекомендации. Попробуйте обновить страницу позже; справочный каталог доступен отдельно.');
    }
  });
}
